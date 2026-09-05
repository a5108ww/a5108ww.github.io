---
layout: post
title: "OpenTelemetry"
date: 2026-09-02
---

# Open Telemetry

一、前言

1.Metrics
數值型的時間序列資料

常見用途：
CPU / Memory 使用率
Request 數量（QPS）
錯誤率（Error Rate）
延遲（Latency / Response Time）

特性：
聚合後的數據（不是每個請求一筆）
體積小、適合長期儲存
很適合做 Dashboard / Alert

常見 Metric 類型：
ountert只會遞增（例如：請求數）
Gauget可上可下（例如：記憶體用量）
Histogramt分布（例如：請求延遲）

2.Traces
用來追蹤「單一請求」在系統中跑過哪些服務。

核心概念
Trace：一次完整請求
Span：請求中的一個步驟（例如一次 DB 查詢）

特性：
每筆請求都有上下文（Trace ID）
資料量比 Metrics 大
適合做 效能分析 / Debug

3.Logs
事件紀錄。

特性
最詳細、但資料量最大
沒結構時很難查
傳統上和 Metrics / Traces 分離

常見用途
錯誤訊息（Exception / Stack trace）
業務流程紀錄
Debug 資訊

二、結構

.NET 8 App
   ↓ (OTLP)
OpenTelemetry SDK
   ↓
OpenTelemetry Collector
   ↓
Grafana Stack
 ├─ Prometheus（Metrics）
 ├─ Tempo（Traces）
 └─ Loki（Logs，可選）

備註：不要讓 App 直接送資料到 Grafana

三、實作

1.目錄結構

otel-grafana-stack/
├─ docker-compose.yml
├─ prometheus.yml
├─ tempo.yml
├─ loki.yml
└─ otel-collector-config.yml

2.Application 端設定

(1)下載套件
1️⃣ 基本套件
dotnet add package OpenTelemetry
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol

2️⃣ 自動 Instrumentation
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.Runtime

3️⃣ Logs（送 Loki 必要）(.Net 6跟.Net 7才需要，)
dotnet add package OpenTelemetry.Logs

(2)設定appsettings.json

{
  'OpenTelemetry': {
    'Endpoint': 'http://localhost:4317'
  }
}

(3)設定Program.cs
using OpenTelemetry.Logs;//能夠使用Logging.AddOpenTelemetry
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

//自訂 Trace / Span
using System.Diagnostics;

//Otel
const string serviceName = 'otel-dotnet8-demo';
var source = new ActivitySource(serviceName);

// ==========================
// OpenTelemetry
// ==========================
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(serviceName))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSource(serviceName)
            .AddOtlpExporter(o =>
            {
                o.Endpoint = new Uri('http://localhost:4317');
            });
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddOtlpExporter(o =>
            {
                o.Endpoint = new Uri('http://localhost:4317');
            });
    });

// ==========================
// Logging → Loki
// ==========================
builder.Logging.ClearProviders();
builder.Logging.AddOpenTelemetry(o =>
{
    o.IncludeFormattedMessage = true;
    o.IncludeScopes = true;
    o.ParseStateValues = true;

    o.AddOtlpExporter(e =>
    {
        e.Endpoint = new Uri('http://localhost:4317');
    });
});

// ==========================
// Test Endpoints
// ==========================
app.MapGet('/ok', (ILogger<Program> logger) =>
{
    logger.LogInformation('Hello OpenTelemetry!');
    return Results.Ok('OK');
});

app.MapGet('/trace-test', () =>
{
    using var activity = source.StartActivity('manual-span');
    Thread.Sleep(100);
    return 'ok';
});

app.MapGet('/error', (ILogger<Program> logger) =>
{
    logger.LogError('This is a test error');
    return Results.Problem('Boom');
});


var builder = WebApplication.CreateBuilder(args);

const string serviceName = 'my-dotnet8-service';
const string serviceVersion = '1.0.0';

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
    {
        resource
            .AddService(
                serviceName: serviceName,
                serviceVersion: serviceVersion,
                serviceInstanceId: Environment.MachineName);
    })
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            // ----------------- 這裡放 Sampler -----------------
            .SetSampler(new TraceIdRatioBasedSampler(0.1)) // 只抽 10% 的 Trace (0,1=> 10%；1,0=>100%；0,0=>0%)
            // ----------------------------------------------------
            .AddOtlpExporter(opt =>
            {
                opt.Endpoint = new Uri(builder.Configuration['OpenTelemetry:Endpoint']);
            });
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddOtlpExporter(opt =>
            {
                opt.Endpoint = new Uri(builder.Configuration['OpenTelemetry:Endpoint']);
            });
    });

/* ---------- Logs ---------- */
builder.Logging.AddOpenTelemetry(options =>
{
    options.IncludeFormattedMessage = true;
    options.IncludeScopes = true;
    options.ParseStateValues = true;

    // OTLP Exporter 設定
    options.SetResourceBuilder(ResourceBuilder.CreateDefault().AddService('shilvain-backend'));

    options.AddOtlpExporter(opt =>
    {
        opt.Endpoint = new Uri(builder.Configuration['OpenTelemetry:Endpoint']);
    });
});

var app = builder.Build();

app.MapGet('/', (ILogger<Program> logger) =>
{
    logger.LogInformation('Hello from .NET 8 with OpenTelemetry!');
    return 'Hello OpenTelemetry';
});

app.Run();

(3)設定Service Name
.AddService(serviceName: 'backwebside-web-prod')

(4)


備註：
名稱結構建議系統->服務->環境

3.Grafana設定

在Data Source 頁面找到，並設定對應的URL
1️⃣Prometheus URL：http://prometheus:9090
2️⃣ Tempo URL：http://tempo:3200
3️⃣ Loki URL：http://loki:3100

4.Server環境建置

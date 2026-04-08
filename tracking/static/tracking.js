(function () {
    const pageData = readPageData();
    const charts = {};
    const chartTheme = {
        text: '#4b5b6b',
        grid: 'rgba(148, 163, 184, 0.26)',
        primary: '#163a5f',
        benchmark: '#6b7280',
        positive: '#0b7a5a',
        negative: '#c03a32',
        warning: '#b7791f',
        fillPrimary: 'rgba(22, 58, 95, 0.08)',
        fillBenchmark: 'rgba(107, 114, 128, 0.08)'
    };
    const compositionPalette = [
        '#173b2f', '#245041', '#2e6950', '#3c7d5f',
        '#86672d', '#a17e38', '#4d5f55', '#60756a',
        '#6f8798', '#54708a', '#a15347', '#c06a5b',
        '#8ea06b', '#b0bd8b', '#9aa7b5', '#d2dbd2'
    ];
    const companyDomainMap = {
        AAPL: 'apple.com',
        ACGL: 'archgroup.com',
        ADBE: 'adobe.com',
        ADI: 'analog.com',
        AMAT: 'appliedmaterials.com',
        AMZN: 'amazon.com',
        ANET: 'arista.com',
        ASML: 'asml.com',
        AVGO: 'broadcom.com',
        AXP: 'americanexpress.com',
        BAC: 'bankofamerica.com',
        BKNG: 'bookingholdings.com',
        CAT: 'cat.com',
        CDNS: 'cadence.com',
        CME: 'cmegroup.com',
        CMCSA: 'comcast.com',
        CMG: 'chipotle.com',
        COST: 'costco.com',
        CRM: 'salesforce.com',
        CSCO: 'cisco.com',
        DE: 'deere.com',
        DIS: 'disney.com',
        FI: 'fiserv.com',
        FISV: 'fiserv.com',
        GE: 'ge.com',
        GOOGL: 'google.com',
        GOOG: 'google.com',
        GS: 'goldmansachs.com',
        HD: 'homedepot.com',
        IBM: 'ibm.com',
        INTC: 'intel.com',
        INTU: 'intuit.com',
        ISRG: 'intuitive.com',
        JPM: 'jpmorganchase.com',
        KO: 'coca-colacompany.com',
        LIN: 'linde.com',
        LLY: 'lilly.com',
        MA: 'mastercard.com',
        MCD: 'mcdonalds.com',
        MELI: 'mercadolibre.com',
        META: 'meta.com',
        MS: 'morganstanley.com',
        MSFT: 'microsoft.com',
        MU: 'micron.com',
        NFLX: 'netflix.com',
        NKE: 'nike.com',
        NOW: 'servicenow.com',
        NVDA: 'nvidia.com',
        NVO: 'novonordisk.com',
        ORCL: 'oracle.com',
        PANW: 'paloaltonetworks.com',
        PEP: 'pepsico.com',
        PGR: 'progressive.com',
        PG: 'pg.com',
        PLTR: 'palantir.com',
        QCOM: 'qualcomm.com',
        SHOP: 'shopify.com',
        SNPS: 'synopsys.com',
        SPGI: 'spglobal.com',
        TJX: 'tjx.com',
        TMUS: 't-mobile.com',
        TSLA: 'tesla.com',
        TXN: 'ti.com',
        UBER: 'uber.com',
        UNH: 'unitedhealthgroup.com',
        V: 'visa.com',
        WMT: 'walmart.com',
        XOM: 'exxonmobil.com'
    };
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
    const compositionCenterPlugin = {
        id: 'compositionCenterPlugin',
        afterDraw: function (chart, args, pluginOptions) {
            if (chart.config.type !== 'doughnut') {
                return;
            }

            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) {
                return;
            }

            const firstArc = meta.data[0];
            const centerX = firstArc.x;
            const centerY = firstArc.y;
            const ctx = chart.ctx;
            const title = pluginOptions && pluginOptions.title ? pluginOptions.title : 'Allocation';
            const value = pluginOptions && pluginOptions.value ? pluginOptions.value : '';

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#6a746d';
            ctx.font = "700 10px 'IBM Plex Sans', 'Segoe UI', sans-serif";
            ctx.fillText(title, centerX, centerY - 12);
            ctx.fillStyle = '#111713';
            ctx.font = "600 24px 'IBM Plex Mono', 'Segoe UI', monospace";
            ctx.fillText(value, centerX, centerY + 10);
            ctx.restore();
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        configureChartDefaults();
        initializeTabs();
        initializeRefreshAction();
        initializeCharts();
        populateDailyTable();
        addTableSorting();
    });

    function readPageData() {
        const pageDataElement = document.getElementById('tracking-page-data');
        if (!pageDataElement) {
            return { hasReport: false };
        }

        try {
            return JSON.parse(pageDataElement.textContent);
        } catch (error) {
            console.error('Failed to parse tracking page data', error);
            return { hasReport: false };
        }
    }

    function configureChartDefaults() {
        if (!window.Chart) {
            return;
        }

        Chart.defaults.color = chartTheme.text;
        Chart.defaults.borderColor = chartTheme.grid;
        Chart.defaults.font.family = "'IBM Plex Sans', 'Segoe UI', sans-serif";
    }

    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (!tabButtons.length) {
            return;
        }

        tabButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                document.querySelectorAll('.tab-btn').forEach(function (tabButton) {
                    tabButton.classList.remove('active');
                });

                document.querySelectorAll('.tab-content').forEach(function (content) {
                    content.classList.remove('active');
                });

                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
    }

    function initializeRefreshAction() {
        const updateButton = document.getElementById('updateBtn');
        if (!updateButton) {
            return;
        }

        updateButton.addEventListener('click', function () {
            const portfolioId = document.getElementById('portfolioSelect')?.value;
            const mode = document.getElementById('modeSelect')?.value;
            const initialCash = document.getElementById('initialCash')?.value;
            const currentUrl = new URL(window.location.href);
            const nextUrl = new URL(currentUrl.pathname || '/', currentUrl.origin);
            const year = currentUrl.searchParams.get('year');

            if (portfolioId) {
                nextUrl.searchParams.set('portfolio_id', portfolioId);
            }
            if (mode) {
                nextUrl.searchParams.set('mode', mode);
            }
            if (initialCash) {
                nextUrl.searchParams.set('initial_cash', initialCash);
            }
            if (year) {
                nextUrl.searchParams.set('year', year);
            }

            window.location.href = nextUrl.toString();
        });
    }

    function initializeCharts() {
        if (!pageData.hasReport || !window.Chart) {
            return;
        }

        const dates = pageData.dates || [];
        const values = pageData.values || [];
        const benchmarkValues = pageData.benchmarkValues || [];
        const stockPerformance = pageData.stockPerformance || [];
        const dailyReturns = pageData.dailyReturns || [];

        charts.drawdown = createChart('drawdownChart', {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Drawdown',
                    data: calculateDrawdown(values),
                    borderColor: chartTheme.negative,
                    backgroundColor: 'rgba(192, 58, 50, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });

        charts.rolling = createChart('rollingChart', {
            type: 'line',
            data: {
                labels: dates.slice(30),
                datasets: [{
                    label: '30-day Rolling Returns',
                    data: calculateRollingReturns(values, 30),
                    borderColor: chartTheme.warning,
                    backgroundColor: 'rgba(183, 121, 31, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        charts.performance = createChart('performanceChart', {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Value',
                    data: values,
                    borderColor: '#1c6b4f',
                    backgroundColor: 'rgba(28, 107, 79, 0.12)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.24,
                    pointRadius: 2.5,
                    pointHoverRadius: 5,
                    pointBorderWidth: 0,
                    pointBackgroundColor: '#1c6b4f'
                }, {
                    label: 'S&P 500 (Normalized)',
                    data: benchmarkValues,
                    borderColor: '#5b6670',
                    backgroundColor: chartTheme.fillBenchmark,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.22,
                    pointRadius: 2.5,
                    pointHoverRadius: 5,
                    pointBorderWidth: 0,
                    pointBackgroundColor: '#5b6670',
                    borderDash: [7, 6]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        displayColors: false,
                        backgroundColor: 'rgba(17, 23, 19, 0.96)',
                        titleColor: '#f4f7f4',
                        bodyColor: '#f4f7f4',
                        padding: 12,
                        callbacks: {
                            title: function (tooltipItems) {
                                return tooltipItems.length ? tooltipItems[0].label : '';
                            },
                            label: function (context) {
                                return context.dataset.label + ': ' + currencyFormatter.format(context.parsed.y);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.18)'
                        },
                        ticks: {
                            callback: function (value) {
                                return currencyFormatter.format(value);
                            }
                        }
                    }
                }
            }
        });
        renderPerformanceSummary(values, benchmarkValues);
        renderPerformanceLegend();

        const compositionHoldings = stockPerformance.slice().sort(function (left, right) {
            return (Number(right.weight) || 0) - (Number(left.weight) || 0);
        });

        charts.composition = createChart('compositionChart', {
            type: 'doughnut',
            data: {
                labels: compositionHoldings.map(function (stock) { return stock.ticker; }),
                datasets: [{
                    data: compositionHoldings.map(function (stock) { return stock.weight; }),
                    backgroundColor: compositionHoldings.map(function (_, index) {
                        return compositionPalette[index % compositionPalette.length];
                    }),
                    borderColor: '#f5f8f3',
                    borderWidth: 6,
                    borderRadius: 14,
                    spacing: 4,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                layout: {
                    padding: 8
                },
                plugins: {
                    compositionCenterPlugin: {
                        title: 'Holdings',
                        value: String(compositionHoldings.length)
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,
                        external: function (context) {
                            renderCompositionTooltip(context, compositionHoldings);
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
        renderCompositionLegend(compositionHoldings);

        charts.stocks = createChart('stocksChart', {
            type: 'bar',
            data: {
                labels: stockPerformance.map(function (stock) { return stock.ticker; }),
                datasets: [{
                    label: 'Return (%)',
                    data: stockPerformance.map(function (stock) { return stock.return; }),
                    backgroundColor: function (context) {
                        const value = context.dataset.data[context.dataIndex];
                        return value >= 0 ? 'rgba(11, 122, 90, 0.72)' : 'rgba(192, 58, 50, 0.72)';
                    },
                    borderColor: function (context) {
                        const value = context.dataset.data[context.dataIndex];
                        return value >= 0 ? chartTheme.positive : chartTheme.negative;
                    },
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        const monthlyPortfolio = monthlySeries(dates, values);
        const monthlyBenchmark = monthlySeries(dates, benchmarkValues);
        const portfolioMonthlyReturns = monthlyReturns(monthlyPortfolio);
        const benchmarkMonthlyReturns = monthlyReturns(monthlyBenchmark);
        const portfolioMonthlyDrawdowns = drawdownFromMonthly(monthlyPortfolio);
        const benchmarkMonthlyDrawdowns = drawdownFromMonthly(monthlyBenchmark);

        charts.monthlyReturn = createChart('monthlyReturnChart', {
            type: 'bar',
            data: {
                labels: portfolioMonthlyReturns.labels.map(function (label) {
                    return formatMonthLabel(label);
                }),
                datasets: [{
                    label: 'Portfolio Monthly Return %',
                    data: portfolioMonthlyReturns.values,
                    backgroundColor: 'rgba(45, 111, 82, 0.76)',
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 28,
                    categoryPercentage: 0.82,
                    barPercentage: 0.92
                }, {
                    label: 'S&P 500 Monthly Return %',
                    data: benchmarkMonthlyReturns.values,
                    backgroundColor: 'rgba(91, 102, 112, 0.62)',
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 28,
                    categoryPercentage: 0.82,
                    barPercentage: 0.92
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        displayColors: false,
                        backgroundColor: 'rgba(17, 23, 19, 0.96)',
                        titleColor: '#f4f7f4',
                        bodyColor: '#f4f7f4',
                        padding: 12,
                        callbacks: {
                            title: function (tooltipItems) {
                                return tooltipItems.length ? tooltipItems[0].label : '';
                            },
                            label: function (context) {
                                return context.dataset.label + ': ' + formatSignedPercent(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.18)'
                        },
                        ticks: {
                            callback: function (value) {
                                return formatSignedPercent(value);
                            }
                        }
                    }
                }
            }
        });

        charts.monthlyDrawdown = createChart('monthlyDrawdownChart', {
            type: 'line',
            data: {
                labels: portfolioMonthlyDrawdowns.labels.map(function (label) {
                    return formatMonthLabel(label);
                }),
                datasets: [{
                    label: 'Portfolio Drawdown %',
                    data: portfolioMonthlyDrawdowns.values,
                    borderColor: '#c44536',
                    backgroundColor: 'rgba(196, 69, 54, 0.08)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.22,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#c44536'
                }, {
                    label: 'S&P 500 Drawdown %',
                    data: benchmarkMonthlyDrawdowns.values,
                    borderColor: '#5b6670',
                    backgroundColor: 'rgba(91, 102, 112, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.22,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#5b6670',
                    borderDash: [7, 6]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        displayColors: false,
                        backgroundColor: 'rgba(17, 23, 19, 0.96)',
                        titleColor: '#f4f7f4',
                        bodyColor: '#f4f7f4',
                        padding: 12,
                        callbacks: {
                            title: function (tooltipItems) {
                                return tooltipItems.length ? tooltipItems[0].label : '';
                            },
                            label: function (context) {
                                return context.dataset.label + ': ' + formatSignedPercent(context.parsed.y);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.18)'
                        },
                        ticks: {
                            callback: function (value) {
                                return formatSignedPercent(value);
                            }
                        }
                    }
                }
            }
        });

        charts.daily = createChart('dailyChart', {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Portfolio Value',
                    data: values,
                    borderColor: chartTheme.primary,
                    backgroundColor: chartTheme.fillPrimary,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '$' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        if (dailyReturns.length > 0) {
            const returnsData = calculateHistogramData(dailyReturns, 20);
            charts.returns = createChart('returnsChart', {
                type: 'bar',
                data: {
                    labels: returnsData.bins,
                    datasets: [{
                        label: 'Frequency',
                        data: returnsData.frequencies,
                        backgroundColor: 'rgba(99, 116, 139, 0.68)',
                        borderColor: 'rgba(75, 91, 107, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const returnPercent = (context.label * 100).toFixed(2);
                                    return returnPercent + '%: ' + context.parsed.y + ' days';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Daily Return (%)'
                            },
                            ticks: {
                                callback: function (value) {
                                    return (value * 100).toFixed(1) + '%';
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Frequency'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            showChartEmptyState('returnsChart', 'Daily returns data not available');
        }

        const maxHoldingValue = Math.max.apply(null, stockPerformance.map(function (stock) {
            return stock.current_value || 0;
        }).concat(1));

        charts.riskReturn = createChart('riskReturnChart', {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Holdings',
                    data: stockPerformance.map(function (stock) {
                        return {
                            x: stock.weight,
                            y: stock.return,
                            r: 5 + (((stock.current_value || 0) / maxHoldingValue) * 8)
                        };
                    }),
                    backgroundColor: 'rgba(22, 58, 95, 0.22)',
                    borderColor: chartTheme.primary,
                    borderWidth: 1.5,
                    hoverBackgroundColor: 'rgba(22, 58, 95, 0.32)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const stock = stockPerformance[context.dataIndex];
                                return stock.ticker + ': ' + stock.weight.toFixed(1) + '% weight, ' + stock.return.toFixed(2) + '% return';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Weight (%)'
                        },
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Return (%)'
                        },
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    function createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) {
            return null;
        }

        const mergedConfig = Object.assign({}, config);
        const existingPlugins = Array.isArray(config.plugins) ? config.plugins.slice() : [];

        if (canvasId === 'compositionChart') {
            existingPlugins.push(compositionCenterPlugin);
        }

        if (existingPlugins.length) {
            mergedConfig.plugins = existingPlugins;
        }

        return new Chart(canvas.getContext('2d'), mergedConfig);
    }

    function getCompanyLogoMeta(ticker) {
        const normalizedTicker = String(ticker || '').toUpperCase();
        const domain = companyDomainMap[normalizedTicker];
        return {
            ticker: normalizedTicker,
            domain: domain || null,
            url: domain ? 'https://logos.hunter.io/' + domain + '?size=64' : null,
            fallback: normalizedTicker.slice(0, 2)
        };
    }

    function renderPerformanceSummary(values, benchmarkValues) {
        const summaryElement = document.getElementById('performanceSummary');
        if (!summaryElement) {
            return;
        }

        const portfolioCurrent = values.length ? Number(values[values.length - 1]) : 0;
        const benchmarkCurrent = benchmarkValues.length ? Number(benchmarkValues[benchmarkValues.length - 1]) : 0;
        const portfolioStart = values.length ? Number(values[0]) : 0;
        const benchmarkStart = benchmarkValues.length ? Number(benchmarkValues[0]) : 0;
        const spreadValue = portfolioCurrent - benchmarkCurrent;
        const portfolioReturn = portfolioStart ? ((portfolioCurrent - portfolioStart) / portfolioStart) * 100 : 0;
        const benchmarkReturn = benchmarkStart ? ((benchmarkCurrent - benchmarkStart) / benchmarkStart) * 100 : 0;
        const spreadReturn = portfolioReturn - benchmarkReturn;

        summaryElement.innerHTML =
            '<div class="performance-summary-card performance-summary-card--portfolio">' +
                '<span class="performance-summary-label">Portfolio</span>' +
                '<span class="performance-summary-value">' + currencyFormatter.format(portfolioCurrent) + '</span>' +
                '<span class="performance-summary-note">' + formatSignedPercent(portfolioReturn) + '</span>' +
            '</div>' +
            '<div class="performance-summary-card performance-summary-card--benchmark">' +
                '<span class="performance-summary-label">S&amp;P 500</span>' +
                '<span class="performance-summary-value">' + currencyFormatter.format(benchmarkCurrent) + '</span>' +
                '<span class="performance-summary-note">' + formatSignedPercent(benchmarkReturn) + '</span>' +
            '</div>' +
            '<div class="performance-summary-card performance-summary-card--spread">' +
                '<span class="performance-summary-label">Spread</span>' +
                '<span class="performance-summary-value">' + formatSignedCurrency(spreadValue) + '</span>' +
                '<span class="performance-summary-note">' + formatSignedPercent(spreadReturn) + '</span>' +
            '</div>';
    }

    function renderPerformanceLegend() {
        const legendElement = document.getElementById('performanceLegend');
        if (!legendElement) {
            return;
        }

        legendElement.innerHTML =
            '<div class="performance-legend-item">' +
                '<span class="performance-legend-swatch performance-legend-swatch--portfolio"></span>' +
                '<span class="performance-legend-copy">' +
                    '<span class="performance-legend-title">Portfolio</span>' +
                    '<span class="performance-legend-caption">Active portfolio value</span>' +
                '</span>' +
            '</div>' +
            '<div class="performance-legend-item">' +
                '<span class="performance-legend-swatch performance-legend-swatch--benchmark"></span>' +
                '<span class="performance-legend-copy">' +
                    '<span class="performance-legend-title">S&amp;P 500</span>' +
                    '<span class="performance-legend-caption">Normalized benchmark</span>' +
                '</span>' +
            '</div>';
    }

    function renderCompositionTooltip(context, stockPerformance) {
        const tooltipModel = context.tooltip;
        const chart = context.chart;
        const tooltipElement = getOrCreateCompositionTooltip(chart);

        if (!tooltipModel || tooltipModel.opacity === 0 || !tooltipModel.dataPoints || !tooltipModel.dataPoints.length) {
            tooltipElement.style.opacity = '0';
            return;
        }

        const dataPoint = tooltipModel.dataPoints[0];
        const stock = stockPerformance[dataPoint.dataIndex];
        if (!stock) {
            tooltipElement.style.opacity = '0';
            return;
        }

        const logoMeta = getCompanyLogoMeta(stock.ticker);
        const logoMarkup = logoMeta.url
            ? '<span class="composition-tooltip-logo-wrap" data-logo-shell>' +
                '<img class="composition-tooltip-logo" src="' + logoMeta.url + '" alt="' + escapeHtml(stock.ticker) + ' logo" loading="lazy">' +
                '<span class="composition-tooltip-fallback" data-logo-fallback>' + escapeHtml(logoMeta.fallback) + '</span>' +
              '</span>'
            : '<span class="composition-tooltip-fallback is-visible">' + escapeHtml(logoMeta.fallback) + '</span>';

        tooltipElement.innerHTML =
            '<div class="composition-tooltip-shell">' +
                '<div class="composition-tooltip-brand">' +
                    logoMarkup +
                    '<div class="composition-tooltip-copy">' +
                        '<span class="composition-tooltip-title">' + escapeHtml(stock.ticker) + '</span>' +
                        '<span class="composition-tooltip-label">Portfolio weight</span>' +
                    '</div>' +
                '</div>' +
                '<span class="composition-tooltip-value">' + Number(stock.weight).toFixed(1) + '%</span>' +
            '</div>';

        bindLogoFallbacks(tooltipElement);

        const canvasRect = chart.canvas.getBoundingClientRect();
        const parentRect = chart.canvas.parentNode.getBoundingClientRect();
        tooltipElement.style.opacity = '1';
        tooltipElement.style.left = (tooltipModel.caretX + (canvasRect.left - parentRect.left) + 14) + 'px';
        tooltipElement.style.top = (tooltipModel.caretY + (canvasRect.top - parentRect.top) - 12) + 'px';
    }

    function getOrCreateCompositionTooltip(chart) {
        const parent = chart.canvas.parentNode;
        let tooltipElement = parent.querySelector('.composition-tooltip');

        if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'composition-tooltip';
            parent.appendChild(tooltipElement);
        }

        return tooltipElement;
    }

    function bindLogoFallbacks(scope) {
        scope.querySelectorAll('[data-logo-shell]').forEach(function (shell) {
            const image = shell.querySelector('img');
            const fallback = shell.querySelector('[data-logo-fallback]');
            if (!image || !fallback || image.dataset.logoBound === 'true') {
                return;
            }

            image.dataset.logoBound = 'true';
            image.addEventListener('error', function () {
                image.classList.add('is-hidden');
                fallback.classList.add('is-visible');
            });
            image.addEventListener('load', function () {
                image.classList.remove('is-hidden');
                fallback.classList.remove('is-visible');
            });
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatSignedPercent(value) {
        const sign = value > 0 ? '+' : '';
        return sign + Number(value).toFixed(1) + '%';
    }

    function formatSignedCurrency(value) {
        const absolute = currencyFormatter.format(Math.abs(Number(value) || 0));
        if (value > 0) {
            return '+' + absolute;
        }
        if (value < 0) {
            return '-' + absolute;
        }
        return absolute;
    }

    function formatMonthLabel(value) {
        const raw = String(value || '');
        const parts = raw.split('-');
        if (parts.length < 2) {
            return raw;
        }

        const year = parts[0];
        const monthIndex = Number(parts[1]) - 1;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[monthIndex] || parts[1];
        return monthName + " '" + year.slice(-2);
    }

    function showChartEmptyState(canvasId, message) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.parentElement) {
            return;
        }

        canvas.parentElement.innerHTML = '<div class="empty-state"><p>' + message + '</p></div>';
    }

    function calculateDrawdown(values) {
        if (!values || values.length === 0) {
            return [];
        }

        const drawdowns = [];
        let peak = values[0];

        values.forEach(function (value) {
            peak = Math.max(peak, value);
            drawdowns.push(((value - peak) / peak) * 100);
        });

        return drawdowns;
    }

    function renderCompositionLegend(stockPerformance) {
        const legendElement = document.getElementById('compositionLegend');
        if (!legendElement) {
            return;
        }

        if (!stockPerformance.length) {
            legendElement.innerHTML = '';
            return;
        }

        legendElement.innerHTML = stockPerformance.map(function (stock, index) {
            const color = compositionPalette[index % compositionPalette.length];
            const logoMeta = getCompanyLogoMeta(stock.ticker);
            const logoMarkup = logoMeta.url
                ? '<span class="composition-logo" data-logo-shell>' +
                    '<img class="composition-logo-image" src="' + logoMeta.url + '" alt="' + escapeHtml(stock.ticker) + ' logo" loading="lazy">' +
                    '<span class="composition-logo-fallback" data-logo-fallback>' + escapeHtml(logoMeta.fallback) + '</span>' +
                  '</span>'
                : '<span class="composition-logo composition-logo--fallback-only">' +
                    '<span class="composition-logo-fallback is-visible">' + escapeHtml(logoMeta.fallback) + '</span>' +
                  '</span>';
            return (
                '<div class="composition-legend-item">' +
                    '<span class="composition-legend-swatch" style="background:' + color + ';"></span>' +
                    '<div class="composition-legend-main">' +
                        '<div class="composition-legend-heading">' +
                            logoMarkup +
                            '<span class="composition-legend-ticker">' + escapeHtml(stock.ticker) + '</span>' +
                        '</div>' +
                        '<span class="composition-legend-caption">Current allocation</span>' +
                        '<span class="composition-legend-meter"><span class="composition-legend-fill" style="width:' + Number(stock.weight).toFixed(1) + '%; background:' + color + ';"></span></span>' +
                    '</div>' +
                    '<span class="composition-legend-weight">' + Number(stock.weight).toFixed(1) + '%</span>' +
                '</div>'
            );
        }).join('');
        bindLogoFallbacks(legendElement);
    }

    function calculateRollingReturns(values, windowSize) {
        if (!values || values.length <= windowSize) {
            return [];
        }

        const rollingReturns = [];
        for (let index = windowSize; index < values.length; index += 1) {
            const returnValue = ((values[index] - values[index - windowSize]) / values[index - windowSize]) * 100;
            rollingReturns.push(returnValue);
        }

        return rollingReturns;
    }

    function calculateHistogramData(data, bins) {
        if (!data || data.length === 0) {
            return { bins: [], frequencies: [] };
        }

        const min = Math.min.apply(null, data);
        const max = Math.max.apply(null, data);
        const binSize = (max - min) / bins || 1;
        const histogramBins = [];
        const frequencies = new Array(bins).fill(0);

        for (let index = 0; index <= bins; index += 1) {
            histogramBins.push(min + (index * binSize));
        }

        data.forEach(function (value) {
            let binIndex = Math.floor((value - min) / binSize);
            if (binIndex === bins) {
                binIndex = bins - 1;
            }
            if (binIndex >= 0 && binIndex < bins) {
                frequencies[binIndex] += 1;
            }
        });

        return {
            bins: histogramBins.slice(0, -1),
            frequencies: frequencies
        };
    }

    function monthlySeries(dates, values) {
        const monthlyMap = {};
        dates.forEach(function (date, index) {
            monthlyMap[String(date).slice(0, 7)] = values[index];
        });
        return monthlyMap;
    }

    function monthlyReturns(monthMap) {
        const keys = Object.keys(monthMap).sort();
        const returns = [];

        for (let index = 1; index < keys.length; index += 1) {
            const previousValue = monthMap[keys[index - 1]];
            const currentValue = monthMap[keys[index]];
            returns.push(previousValue ? ((currentValue / previousValue) - 1) * 100 : 0);
        }

        return {
            labels: keys.slice(1),
            values: returns
        };
    }

    function drawdownFromMonthly(monthMap) {
        const keys = Object.keys(monthMap).sort();
        let peak = -Infinity;

        return {
            labels: keys,
            values: keys.map(function (key) {
                const value = monthMap[key];
                peak = Math.max(peak, value);
                return peak > 0 ? ((value - peak) / peak) * 100 : 0;
            })
        };
    }

    function populateDailyTable() {
        if (!pageData.hasReport) {
            return;
        }

        const tableBody = document.getElementById('dailyTableBody');
        const dates = pageData.dates || [];
        const values = pageData.values || [];

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = '';

        if (dates.length < 2 || values.length < 2) {
            tableBody.innerHTML = '<tr class="table-empty"><td colspan="7">Need at least 2 days of data to show daily performance</td></tr>';
            return;
        }

        const initialValue = values[0];
        const currentValue = values[values.length - 1];
        const totalReturn = initialValue ? (((currentValue - initialValue) / initialValue) * 100) : 0;
        let cumulativeReturn = 0;
        let runningMax = initialValue;

        const summaryRow = document.createElement('tr');
        summaryRow.className = 'summary-row';
        summaryRow.dataset.summary = 'true';
        summaryRow.innerHTML = [
            '<td colspan="7">',
            'Showing ' + dates.length + ' trading days | ',
            'Initial: $' + initialValue.toFixed(2) + ' | ',
            'Current: $' + currentValue.toFixed(2) + ' | ',
            'Total Return: <span class="' + (totalReturn >= 0 ? 'positive' : 'negative') + '">',
            totalReturn.toFixed(2) + '%',
            '</span>',
            '</td>'
        ].join('');
        tableBody.appendChild(summaryRow);

        dates.forEach(function (date, index) {
            const value = values[index];
            let dailyReturn = 0;
            let dailyPL = 0;

            if (index > 0) {
                dailyReturn = ((value - values[index - 1]) / values[index - 1]);
                cumulativeReturn += dailyReturn;
                dailyPL = value - values[index - 1];
            }

            runningMax = Math.max(runningMax, value);
            const dailyDrawdown = ((value - runningMax) / runningMax) * 100;

            const row = document.createElement('tr');
            if (index === dates.length - 1) {
                row.classList.add('latest-row');
            }

            row.innerHTML = [
                '<td data-order="', escapeHtml(date), '">', formatDate(date), '</td>',
                '<td>$', value.toFixed(2), '</td>',
                '<td class="', dailyReturn >= 0 ? 'positive' : 'negative', '">', (dailyReturn * 100).toFixed(2), '%</td>',
                '<td class="', cumulativeReturn >= 0 ? 'positive' : 'negative', '">', (cumulativeReturn * 100).toFixed(2), '%</td>',
                '<td class="', dailyPL >= 0 ? 'positive' : 'negative', '">$' + dailyPL.toFixed(2) + '</td>',
                '<td class="', dailyDrawdown <= 0 ? 'negative' : 'positive', '">', dailyDrawdown.toFixed(2), '%</td>',
                '<td>', runningMax.toFixed(2), '</td>'
            ].join('');

            tableBody.appendChild(row);
        });
    }

    function formatDate(dateString) {
        if (!dateString) {
            return '';
        }

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    function addTableSorting() {
        document.querySelectorAll('.table-responsive table').forEach(function (table) {
            const headers = table.querySelectorAll('th');
            headers.forEach(function (header, index) {
                header.addEventListener('click', function () {
                    const nextDirection = header.dataset.sortDirection === 'asc' ? 'desc' : 'asc';

                    headers.forEach(function (th) {
                        th.dataset.sortDirection = '';
                        th.classList.remove('th-sort-asc', 'th-sort-desc');
                    });

                    sortTableByColumn(table, index, nextDirection === 'asc');

                    header.dataset.sortDirection = nextDirection;
                    header.classList.toggle('th-sort-asc', nextDirection === 'asc');
                    header.classList.toggle('th-sort-desc', nextDirection === 'desc');
                });
            });
        });
    }

    function sortTableByColumn(table, column, ascending) {
        const tbody = table.tBodies[0];
        if (!tbody) {
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const summaryRows = rows.filter(function (row) {
            return row.dataset.summary === 'true';
        });
        const sortableRows = rows.filter(function (row) {
            return row.dataset.summary !== 'true';
        });

        sortableRows.sort(function (rowA, rowB) {
            const cellA = rowA.querySelector('td:nth-child(' + (column + 1) + ')');
            const cellB = rowB.querySelector('td:nth-child(' + (column + 1) + ')');
            const valueA = getSortableValue(cellA);
            const valueB = getSortableValue(cellB);

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return ascending ? valueA - valueB : valueB - valueA;
            }

            const normalizedA = String(valueA).toLowerCase();
            const normalizedB = String(valueB).toLowerCase();
            return ascending ? normalizedA.localeCompare(normalizedB) : normalizedB.localeCompare(normalizedA);
        });

        tbody.innerHTML = '';
        summaryRows.concat(sortableRows).forEach(function (row) {
            tbody.appendChild(row);
        });
    }

    function getSortableValue(cell) {
        if (!cell) {
            return '';
        }

        if (cell.dataset.order) {
            return cell.dataset.order;
        }

        const text = cell.textContent.trim();
        const normalized = text.replace(/[$,%]/g, '').replace(/,/g, '');
        const numericValue = Number(normalized);

        if (text !== '' && !Number.isNaN(numericValue)) {
            return numericValue;
        }

        return text;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();

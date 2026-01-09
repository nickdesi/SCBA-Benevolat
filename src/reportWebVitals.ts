import { onLCP, onINP, onCLS, Metric } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        onLCP(onPerfEntry);
        onINP(onPerfEntry);
        onCLS(onPerfEntry);
    } else {
        // Default behavior: Log to console in dev, Send to GA in prod
        const sendToAnalytics = (metric: Metric) => {
            // Send to Google Analytics
            if (typeof window.gtag === 'function') {
                window.gtag('event', metric.name, {
                    value: metric.value,
                    metric_id: metric.id,
                    metric_value: metric.value,
                    metric_delta: metric.delta,
                });
            }

            // Log to console in dev
            if (import.meta.env.DEV) {
                console.log(`[Web Vitals] ${metric.name}:`, metric);
            }
        };

        onLCP(sendToAnalytics);
        onINP(sendToAnalytics);
        onCLS(sendToAnalytics);
    }
};

export default reportWebVitals;

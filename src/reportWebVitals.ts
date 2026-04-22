import { onLCP, onINP, onCLS, Metric } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        onLCP(onPerfEntry);
        onINP(onPerfEntry);
        onCLS(onPerfEntry);
    } else {
        // Default behavior: Send to GA in prod
        const sendToAnalytics = (metric: Metric) => {
            // Send to Google Analytics
            if (typeof (window as any).gtag === 'function') {
                (window as any).gtag('event', metric.name, {
                    value: metric.value,
                    metric_id: metric.id,
                    metric_value: metric.value,
                    metric_delta: metric.delta,
                });
            }
        };

        onLCP(sendToAnalytics);
        onINP(sendToAnalytics);
        onCLS(sendToAnalytics);
    }
};

export default reportWebVitals;

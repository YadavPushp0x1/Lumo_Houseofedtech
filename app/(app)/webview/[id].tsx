import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { useCoursesStore } from '@/stores/course-store';

function buildHtml(payload: {
  courseTitle: string;
  instructorName: string;
  courseDescription: string;
  nativeCourseIdHeader: string;
}) {
  const safe = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safe(payload.courseTitle)}</title>
    <style>
      body { font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; padding: 18px; }
      .pill { display:inline-block; padding:6px 10px; border-radius:999px; background:#e0f2fe; color:#075985; font-size:12px; }
      .toast { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: #ecfeff; color: #155e75; display:none; }
      .toast.show { display:block; }
      h1 { margin: 10px 0 0; font-size: 22px; }
      p { color: #334155; line-height: 1.5; }
      .card { margin-top: 14px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 14px; }
      button { width: 100%; padding: 12px; border-radius: 12px; border: 0; background: #0284c7; color: #fff; font-size: 16px; }
    </style>
  </head>
  <body>
    <div class="pill" id="nativeHeader">Native header: ${safe(payload.nativeCourseIdHeader) || 'n/a'}</div>
    <div class="toast" id="toast"></div>
    <h1>${safe(payload.courseTitle)}</h1>
    <p>Instructor: <strong>${safe(payload.instructorName)}</strong></p>
    <div class="card">
      <p>${safe(payload.courseDescription)}</p>
      <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ENROLL_FROM_WEB' }))">Enroll (Web)</button>
    </div>
    <script>
      (function () {
        var toastTimer = null;

        function setHeaderFromNativeId(id) {
          try {
            document.getElementById('nativeHeader').textContent = 'Native header: ' + (id || 'n/a');
          } catch {}
        }

        function showToast(text) {
          try {
            var el = document.getElementById('toast');
            el.textContent = text;
            el.classList.add('show');
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
          } catch {}
        }

        function onNativeMessage(raw) {
          try {
            var msg = JSON.parse(raw);
            if (!msg || !msg.type) return;
            if (msg.type === 'NATIVE_HEADERS' && msg.courseIdHeader != null) {
              setHeaderFromNativeId(String(msg.courseIdHeader || ''));
            }
            if (msg.type === 'PROGRESS_UPDATED') {
              if (msg.progressPct != null) showToast('Progress updated: ' + msg.progressPct + '%');
              else showToast('Progress updated');
            }
          } catch {}
        }

        try {
          var h = window.__NATIVE_HEADERS || {};
          setHeaderFromNativeId(h['x-course-id'] || '');
        } catch {}

        document.addEventListener('message', function (e) { onNativeMessage(e && e.data); });
        window.addEventListener('message', function (e) { onNativeMessage(e && e.data); });
      })();
    </script>
  </body>
</html>`;
}

export default function WebViewScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const courseId = Array.isArray(id) ? id[0] : id;
  const courses = useCoursesStore((s) => s.courses);
  const enrollments = useCoursesStore((s) => s.enrollments);
  const enroll = useCoursesStore((s) => s.enroll);
  const bumpProgress = useCoursesStore((s) => s.bumpProgress);

  const course = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);
  const enrolled = courseId ? Boolean(enrollments[courseId]) : false;
  const progress = courseId ? enrollments[courseId]?.progressPct ?? 0 : 0;
  const webRef = useRef<WebView>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const html = useMemo(() => {
    return buildHtml({
      courseTitle: course?.title ?? 'Course',
      instructorName: course?.instructorName ?? 'Instructor',
      courseDescription: course?.description ?? '',
      nativeCourseIdHeader: String(courseId ?? ''),
    });
  }, [course, courseId]);

  const injected = useMemo(() => {
    const headers = { 'x-course-id': String(courseId ?? '') };
    return `window.__NATIVE_HEADERS = ${JSON.stringify(headers)}; true;`;
  }, [courseId]);

  const onMessage = async (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string };
      if (msg.type === 'ENROLL_FROM_WEB' && courseId) {
        await enroll(courseId);
        await bumpProgress(courseId, 10);
        const nextPct = useCoursesStore.getState().enrollments[courseId]?.progressPct ?? 0;
        setFeedback(`Progress updated: ${nextPct}%`);
        webRef.current?.postMessage(JSON.stringify({ type: 'PROGRESS_UPDATED', progressPct: nextPct }));
      }
    } catch {
      // ignore
    }
  };

  if (!course) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No course loaded</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>Failed to load content</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{course.title}</Text>
            {enrolled ? (
              <View style={styles.progressWrap}>
                <Text style={styles.progressLabel}>Progress: {Math.max(0, Math.min(100, progress))}%</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
                </View>
              </View>
            ) : (
              <Text style={styles.notEnrolled}>Not enrolled yet</Text>
            )}
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          </View>
          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator />
            </View>
          ) : null}
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            injectedJavaScriptBeforeContentLoaded={injected}
            onMessage={onMessage}
            onError={(e) => setError(e.nativeEvent.description)}
            onLoadEnd={() => {
              setLoading(false);
              if (courseId) {
                webRef.current?.postMessage(JSON.stringify({ type: 'NATIVE_HEADERS', courseIdHeader: String(courseId) }));
                if (useCoursesStore.getState().enrollments[courseId]) {
                  bumpProgress(courseId, 10);
                  const nextPct = useCoursesStore.getState().enrollments[courseId]?.progressPct ?? 0;
                  setFeedback(`Progress updated: ${nextPct}%`);
                  webRef.current?.postMessage(JSON.stringify({ type: 'PROGRESS_UPDATED', progressPct: nextPct }));
                }
              }
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  notEnrolled: { marginTop: 6, fontSize: 12, color: '#64748b' },
  feedback: { marginTop: 6, fontSize: 12, color: '#0f766e' },
  progressWrap: { marginTop: 8 },
  progressLabel: { fontSize: 12, color: '#64748b' },
  progressTrack: { marginTop: 4, height: 8, width: '100%', overflow: 'hidden', borderRadius: 999, backgroundColor: '#f1f5f9' },
  progressFill: { height: 8, backgroundColor: '#0284c7' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  errorText: { marginTop: 4, textAlign: 'center', color: '#475569' },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 12,
  },
});

import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React from 'react';

const C = {
  bg: '#F5F7FF',
  white: '#FFFFFF',
  primary: '#6366f1',
  primaryLt: '#a5b4fc',
  text: '#1e1b4b',
  muted: '#9ca3af',
  border: '#e5e7eb',
  danger: '#ef4444',
};

function buildCourseHTML(
  title: string,
  courseId: string,
  price: string,
  category: string,
  instructor: string,
  rating: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #F5F7FF; color: #1e1b4b;
          padding: 20px 16px 40px;
        }
        #native-banner {
          display: none;
          background: #ede9fe;
          border: 1.5px solid #c4b5fd;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #4c1d95;
        }
        #native-banner.visible { display: block; }
        #native-banner strong { font-weight: 700; }

        .hero {
          background: #6366f1;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 14px;
          color: #fff;
        }
        .badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          margin-bottom: 10px; letter-spacing: 0.5px;
        }
        .hero h1 { font-size: 19px; font-weight: 800; line-height: 1.3; margin-bottom: 6px; }
        .hero .meta { font-size: 12px; opacity: 0.8; margin-bottom: 14px; }
        .stats { display: flex; gap: 8px; }
        .stat {
          flex: 1; background: rgba(255,255,255,0.15);
          border-radius: 10px; padding: 8px; text-align: center;
        }
        .stat-val { font-size: 14px; font-weight: 800; display: block; }
        .stat-lbl { font-size: 10px; opacity: 0.8; }

        .card {
          background: #fff; border-radius: 14px;
          padding: 14px; margin-bottom: 12px;
          border: 1.5px solid #e5e7eb;
        }
        .card h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; }

        .progress-bar {
          background: #e5e7eb; border-radius: 6px;
          height: 8px; overflow: hidden; margin-top: 8px;
        }
        .progress-fill {
          height: 100%; background: #6366f1;
          border-radius: 6px; width: 35%;
        }
        .progress-label {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #9ca3af; margin-top: 5px;
        }

        .lesson {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
        }
        .lesson:last-child { border-bottom: none; }
        .lesson-num {
          width: 32px; height: 32px; border-radius: 10px;
          background: #ede9fe; color: #6366f1;
          font-size: 13px; font-weight: 700;
          display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .lesson-num.done { background: #d1fae5; color: #059669; }
        .lesson-title { font-size: 13px; font-weight: 600; color: #1e1b4b; }
        .lesson-dur { font-size: 11px; color: #9ca3af; margin-top: 2px; }

        .info-row {
          display: flex; justify-content: space-between;
          font-size: 13px; padding: 7px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #374151; }
        .info-val { color: #6b7280; }

        .notify-btn {
          background: #6366f1; color: #fff; border: none;
          border-radius: 14px; padding: 15px 24px;
          font-size: 14px; font-weight: 700;
          width: 100%; cursor: pointer; margin-top: 4px;
        }
        .notify-btn:active { opacity: 0.85; }

        .error-banner {
          background: #fee2e2;
          border: 1px solid #ef4444;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          color: #dc2626;
          font-size: 13px;
          text-align: center;
        }
      </style>
    </head>
    <body>

      <div id="native-banner">
        <strong>📲 From Native App (headers):</strong>
        <span id="banner-text"></span>
      </div>

      <div id="error-banner" class="error-banner" style="display:none;">
        ⚠️ <span id="error-text"></span>
      </div>

      <div class="hero">
        <div class="badge">📚 Course Content</div>
        <h1 id="course-title">${title}</h1>
        <p class="meta">ID: ${courseId} · 6 lessons · 2h 30min</p>
        <div class="stats">
          <div class="stat">
            <span class="stat-val">⭐ ${rating}</span>
            <span class="stat-lbl">Rating</span>
          </div>
          <div class="stat">
            <span class="stat-val">$${price}</span>
            <span class="stat-lbl">Price</span>
          </div>
          <div class="stat">
            <span class="stat-val" id="progress-pct">35%</span>
            <span class="stat-lbl">Progress</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Your Progress</h2>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-label">
          <span>2 of 6 lessons complete</span>
          <span id="progress-pct-label">35%</span>
        </div>
      </div>

      <div class="card">
        <h2>Course Info</h2>
        <div class="info-row">
          <span class="info-label">Instructor</span>
          <span class="info-val">${instructor}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Category</span>
          <span class="info-val">${category}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Price</span>
          <span class="info-val">$${price}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration</span>
          <span class="info-val">2h 30min</span>
        </div>
      </div>

      <div class="card">
        <h2>Course Lessons</h2>
        ${[
      { n: 1, title: 'Introduction & Overview', dur: '12 min', done: true },
      { n: 2, title: 'Core Concepts', dur: '28 min', done: true },
      { n: 3, title: 'Hands-on Practice', dur: '35 min', done: false },
      { n: 4, title: 'Advanced Techniques', dur: '40 min', done: false },
      { n: 5, title: 'Real-world Applications', dur: '25 min', done: false },
      { n: 6, title: 'Final Project', dur: '30 min', done: false },
    ].map(l => `
          <div class="lesson" onclick="lessonTapped(${l.n}, '${l.title}')">
            <div class="lesson-num ${l.done ? 'done' : ''}">${l.done ? '✓' : l.n}</div>
            <div>
              <div class="lesson-title">${l.title}</div>
              <div class="lesson-dur">⏱ ${l.dur}</div>
            </div>
          </div>`).join('')}
      </div>

      <button class="notify-btn" onclick="notifyNative()">
        🔔 Notify Me on Completion
      </button>

      <script>
        window.addEventListener('message', function(e) {
          try {
            var data = JSON.parse(e.data);

            if (data.type === 'COURSE_DATA') {
              document.getElementById('course-title').textContent = data.title;

              var bannerText = document.getElementById('banner-text');
              bannerText.textContent =
                ' User: ' + data.username +
                ' | Token expires: ' + data.tokenExpiry +
                ' | Progress: ' + data.progress + '%';
              document.getElementById('native-banner').classList.add('visible');

              if (data.progress) {
                var p = data.progress + '%';
                document.getElementById('progress-fill').style.width = p;
                document.getElementById('progress-pct').textContent = p;
                document.getElementById('progress-pct-label').textContent = p;
              }
            }

            if (data.type === 'SHOW_ERROR') {
              var errorBanner = document.getElementById('error-banner');
              var errorText = document.getElementById('error-text');
              errorText.textContent = data.message;
              errorBanner.style.display = 'block';
              setTimeout(function() {
                errorBanner.style.display = 'none';
              }, 5000);
            }
          } catch(err) {}
        });

        function notifyNative() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'NOTIFY_COMPLETION',
            courseId: '${courseId}',
            title: '${title}',
          }));
        }

        function lessonTapped(num, title) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'LESSON_TAPPED',
            lessonNum: num,
            lessonTitle: title,
          }));
        }
      </script>
    </body>
    </html>
  `;
}

export default function WebViewScreen() {
  const {
    courseId, title, price, category,
    instructor, rating,
    username, tokenExpiry,
  } = useLocalSearchParams<{
    courseId: string;
    title: string;
    price: string;
    category: string;
    instructor: string;
    rating: string;
    username: string;
    tokenExpiry: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const courseTitle = title ?? 'Course Content';
  const htmlContent = buildCourseHTML(
    courseTitle,
    courseId ?? '',
    price ?? '0',
    category ?? 'General',
    instructor ?? 'Instructor',
    rating ?? '4.5',
  );

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (!state.isConnected) {
        setErrorMessage('No internet connection. Please check your network.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoad = () => {
    setLoading(false);
    setError(false);

    const safeTitle = courseTitle.replace(/'/g, "\\'");
    const safeUsername = (username ?? 'guest').replace(/'/g, "\\'");
    const safeExpiry = (tokenExpiry ?? 'N/A').replace(/'/g, "\\'");

    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          type:        'COURSE_DATA',
          title:       '${safeTitle}',
          username:    '${safeUsername}',
          tokenExpiry: '${safeExpiry}',
          progress:    35,
        })
      }));
      true;
    `);
  };

  const handleWebViewError = (error: any) => {
    setError(true);
    setLoading(false);

    let message = 'Failed to load course content.';
    if (isOffline) {
      message = 'No internet connection. Please connect to the internet and try again.';
    } else if (error?.nativeEvent?.description) {
      message = error.nativeEvent.description;
    }

    setErrorMessage(message);

    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'SHOW_ERROR',
          message: '${message.replace(/'/g, "\\'")}'
        })
      }));
      true;
    `);
  };

  const handleHttpError = (event: any) => {
    const { statusCode } = event.nativeEvent;
    if (statusCode >= 400) {
      setError(true);
      setLoading(false);
      let message = `HTTP Error ${statusCode}: `;
      if (statusCode === 404) message += 'Course content not found.';
      else if (statusCode === 500) message += 'Server error. Please try again later.';
      else message += 'Unable to load content.';
      setErrorMessage(message);
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setErrorMessage('');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'NOTIFY_COMPLETION') {
        Alert.alert(
          '🔔 Reminder Set!',
          `You'll be notified when "${data.title}" is complete.`,
          [{ text: 'Got it' }],
        );
      }

      if (data.type === 'LESSON_TAPPED') {
        Alert.alert(
          `Lesson ${data.lessonNum}`,
          `"${data.lessonTitle}" — tap again to start.`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>
          {isOffline ? '📡' : '😕'}
        </Text>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
          {isOffline ? 'No Internet Connection' : 'Failed to Load Content'}
        </Text>
        <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 }}>
          {errorMessage || (isOffline
            ? 'Please check your network connection and try again.'
            : 'There was an error loading the course content. Please try again.')}
        </Text>
        <TouchableOpacity
          onPress={handleRetry}
          style={{ backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{courseTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>
            Loading course content...
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onLoad={handleLoad}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>
              Preparing course content...
            </Text>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: C.bg, padding: 24,
  },
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 15, fontWeight: '700', color: C.text,
    marginHorizontal: 8,
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg, zIndex: 10,
  },
});
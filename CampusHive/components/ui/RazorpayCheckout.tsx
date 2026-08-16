import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface RazorpayCheckoutProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onFailure: (error: string) => void;
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  prefillEmail?: string;
  prefillName?: string;
}

export default function RazorpayCheckout({
  visible,
  onClose,
  onSuccess,
  onFailure,
  razorpayKeyId,
  razorpayOrderId,
  amount,
  currency = 'INR',
  name = 'OnlyStudents',
  description = '₹6 Platform Booking Fee',
  prefillEmail = '',
  prefillName = '',
}: RazorpayCheckoutProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);

  const amountInRupees = (amount / 100).toFixed(2);

  // HTML page that loads Razorpay Checkout.js and opens the payment modal
  const checkoutHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0E2A67 0%, #1F4EA6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 32px 24px;
    }
    .logo { font-size: 48px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { font-size: 14px; opacity: 0.8; margin-bottom: 32px; }
    .amount { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
    .label { font-size: 13px; opacity: 0.7; margin-bottom: 32px; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    .status { font-size: 14px; opacity: 0.9; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg {
      background: rgba(239,68,68,0.2);
      border: 1px solid rgba(239,68,68,0.4);
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
      font-size: 13px;
    }
    .retry-btn {
      margin-top: 16px;
      padding: 12px 32px;
      background: #fff;
      color: #0E2A67;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container" id="main">
    <div class="logo">🐝</div>
    <div class="title">${name}</div>
    <div class="subtitle">${description}</div>
    <div class="amount">₹${amountInRupees}</div>
    <div class="label">Platform Booking Fee</div>
    <div class="spinner"></div>
    <div class="status">Opening payment gateway...</div>
  </div>

  <script>
    function openRazorpay() {
      var options = {
        key: '${razorpayKeyId}',
        amount: ${amount},
        currency: '${currency}',
        name: '${name}',
        description: '${description}',
        order_id: '${razorpayOrderId}',
        prefill: {
          email: '${prefillEmail}',
          contact: '',
          name: '${prefillName}'
        },
        theme: {
          color: '#0E3B84'
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },
        handler: function(response) {
          // Payment succeeded — send data back to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_SUCCESS',
            data: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }
          }));
        },
        modal: {
          ondismiss: function() {
            // User closed the Razorpay modal without paying
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_CANCELLED',
              data: { error: 'Payment was cancelled.' }
            }));
          },
          escape: false,
          backdropclose: false
        }
      };

      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            data: { error: response.error.description || 'Payment failed.' }
          }));
        });
        rzp.open();
      } catch(e) {
        document.getElementById('main').innerHTML = 
          '<div class="logo">⚠️</div>' +
          '<div class="title">Payment Error</div>' +
          '<div class="error-msg">' + e.message + '</div>' +
          '<button class="retry-btn" onclick="openRazorpay()">Retry</button>';
      }
    }

    // Auto-open Razorpay once the page loads
    if (document.readyState === 'complete') {
      setTimeout(openRazorpay, 300);
    } else {
      window.addEventListener('load', function() {
        setTimeout(openRazorpay, 300);
      });
    }
  </script>
</body>
</html>
  `.trim();

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'PAYMENT_SUCCESS') {
        onSuccess(message.data);
      } else if (message.type === 'PAYMENT_FAILED') {
        onFailure(message.data?.error || 'Payment failed.');
      } else if (message.type === 'PAYMENT_CANCELLED') {
        onClose();
      }
    } catch (e) {
      console.error('RazorpayCheckout message parse error:', e);
    }
  };

  if (!visible) return null;

  // Web platform fallback — open in iframe
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={[styles.overlay, { paddingTop: insets.top }]}>  
          <View style={styles.webContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>💳 Razorpay Payment</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.webFallback}>
              <Text style={styles.webFallbackText}>
                Razorpay WebView checkout is only available on mobile devices.
                {'\n\n'}Please test the payment flow on your Android/iOS device.
              </Text>
              <TouchableOpacity style={styles.webCloseBtn} onPress={onClose}>
                <Text style={styles.webCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>💳 Secure Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading Razorpay...</Text>
            </View>
          )}

          <WebView
            ref={webviewRef}
            source={{ html: checkoutHTML }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            mixedContentMode="always"
            originWhitelist={['*']}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  webContainer: {
    height: '50%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  webFallbackText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  webCloseBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  webCloseBtnText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
});

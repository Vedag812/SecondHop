import { testKeys } from '@/lib/rescue-service';
export function GET() {
  try {
    testKeys();
    return Response.json({
      configured: true,
      connected: null,
      mode: 'razorpay_test',
      note: 'Configuration check only; provider connectivity is verified during checkout.',
    });
  } catch {
    return Response.json({
      configured: false,
      connected: null,
      mode: 'simulation',
    });
  }
}

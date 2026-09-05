export const agentManifest = {
  protocol: 'secondhop-demo/1',
  title: 'SecondHop return dispatch prototype',
  supportedStandards: [],
  description:
    'Custom session-scoped demonstration API. No ACP, AP2, NPCI UAP, x402 or escrow conformance is claimed.',
  inventory: 'seeded_demo_parcels',
  logistics: 'human_entered_demo_confirmations',
  paymentModes: ['simulation', 'razorpay_test'],
  livePaymentsEnabled: false,
  authentication:
    'server_issued_demo_workspace_cookie; role_scoped_capability_for_handoff',
  endpoints: {
    workspace: {
      url: '/api/rescue',
      method: 'GET',
    },
    actions: {
      url: '/api/rescue',
      method: 'POST',
      actions: [
        'reserve',
        'order',
        'simulate_payment',
        'verify_payment',
        'check_payment',
        'refund',
        'expire',
      ],
    },
    discovery: {
      url: '/api/agent/v1/discover',
      method: 'POST',
    },
    intent: {
      url: '/api/gemini/intent',
      method: 'POST',
    },
  },
  invariants: [
    'immutable_reserved_price_and_buyer_limit',
    'one_reservation_per_parcel_per_workspace',
    'no_simulation_fallback_from_provider_errors',
    'courier_and_buyer_confirmation',
    'single_use_expiring_handoff',
    'durable_pending_refunds',
  ],
  limitations: [
    'No carrier dispatch integration',
    'No original-buyer refund execution',
    'No merchant settlement execution',
    'Human-entered condition observations are not independent certification',
    'Economics are illustrative estimates',
    'Demo session isolation is not merchant production authentication',
  ],
};

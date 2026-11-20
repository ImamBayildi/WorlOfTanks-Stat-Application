# AdSense activation

Manual display units only: one home placement and one player placement after the overall statistics. No automatic refresh. Local development shows placeholders and never loads the AdSense script. In production, the shared head loads the script for verification; manual placements remain hidden until configuration is complete. Keep Auto ads disabled in the AdSense dashboard.

Public identifiers are stored in lib/adsense.ts: publisher ca-pub-6317092926324469, home unit 5210889566, player unit 3712928887. Only the activation flag is an environment variable:

```text
NEXT_PUBLIC_ADSENSE_READY=false
```

1. Add wotrate.com to AdSense and verify ownership using ads.txt (available once a valid publisher ID is configured). Request review.
2. The owner supplied two responsive display units. Their integration uses CSS-controlled sizes: full container width, 100px high on mobile and 90px on desktop. The supplied auto-format attributes are intentionally omitted to preserve the short banner height. Disable Auto ads, automatic optimizations that add placements, anchors and vignettes in AdSense.
3. In Privacy & messaging, publish Google's European regulations message with consent, refusal and manage-options controls. Configure applicable regional messages and provide /privacy as the privacy URL.
4. Configure Google's consent revocation entry point and verify that preferences can be reopened. Review the privacy page for the actual provider configuration before activation; replace its pending-setup wording.
5. Verify site approval, mobile/desktop rendering, consent/refusal/revocation and navigation using a permitted test setup. Only then set NEXT_PUBLIC_ADSENSE_READY=true and rebuild for production. This flag confirms setup, and is not a substitute for visitor consent. Google CMP manages visitor consent.

The publisher ID and slot IDs are public identifiers, not passwords. Never commit account credentials. Real ad delivery and CMP behavior cannot be validated without the account configuration. Check empty inventory and blocked scripts when testing: statistics must remain usable. Reserved ad height avoids content jumping; unfilled ads may leave reserved space.

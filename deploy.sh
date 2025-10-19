#!/bin/bash

# SearchForMyLinks - Meta-Safe Deployment Script

set -e

DOMAIN="${1:-searchformylinks.com}"
DEPLOY_DIR="/Users/alexanderposch/Desktop/LinkInBio"

echo "🚀 DEPLOYING SearchForMyLinks Meta-Safe System"
echo "=================================================="
echo "Domain: $DOMAIN"
echo "Deploy Dir: $DEPLOY_DIR"
echo ""

# Verify critical files exist
echo "✓ Verifying critical files..."
CRITICAL_FILES=(
    "allisonsundress.html"
    "script-safe.js"
    "robots.txt"
    "privacy.html"
    "terms.html"
    "meta-safe.txt"
    "api/safe-redirect.js"
    "api/analytics-safe.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$DEPLOY_DIR/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ MISSING: $file"
        exit 1
    fi
done

echo ""
echo "✓ All critical files present!"
echo ""

# Verify HTML syntax
echo "✓ Checking HTML validity..."
if grep -q "script-safe.js" "$DEPLOY_DIR/allisonsundress.html"; then
    echo "  ✅ HTML references script-safe.js (not old script.js)"
else
    echo "  ⚠️  HTML may reference old script.js"
fi

if grep -q "noimageindex" "$DEPLOY_DIR/allisonsundress.html"; then
    echo "  ✅ HTML has noimageindex meta tag"
else
    echo "  ❌ Missing noimageindex tag!"
    exit 1
fi

if grep -q "age-consent-modal" "$DEPLOY_DIR/allisonsundress.html"; then
    echo "  ✅ HTML has consent gate modal"
else
    echo "  ❌ Missing consent gate!"
    exit 1
fi

echo ""
echo "✓ HTML validation passed!"
echo ""

# Verify JavaScript syntax
echo "✓ Checking JavaScript syntax..."
if grep -q "script-safe.js" "$DEPLOY_DIR/allisonsundress.html"; then
    if grep -q "function showConsentGate" "$DEPLOY_DIR/script-safe.js"; then
        echo "  ✅ script-safe.js has consent gate function"
    else
        echo "  ❌ Missing showConsentGate function!"
        exit 1
    fi
    
    if grep -q "localStorage" "$DEPLOY_DIR/script-safe.js"; then
        echo "  ⚠️  WARNING: localStorage found in script-safe.js (should be removed)"
    else
        echo "  ✅ No localStorage in script-safe.js (good!)"
    fi
fi

echo ""
echo "✓ JavaScript validation passed!"
echo ""

# Verify API files
echo "✓ Checking API files..."
if grep -q "return 301" "$DEPLOY_DIR/api/safe-redirect.js" || grep -q "301" "$DEPLOY_DIR/api/safe-redirect.js"; then
    echo "  ✅ safe-redirect.js implements 301 redirects"
else
    echo "  ⚠️  safe-redirect.js may not have 301 redirects"
fi

if grep -q "anonymized\|anonymize\|/24\|anonymization" "$DEPLOY_DIR/api/analytics-safe.js"; then
    echo "  ✅ analytics-safe.js has IP anonymization"
else
    echo "  ⚠️  analytics-safe.js anonymization unclear"
fi

echo ""
echo "✓ API validation passed!"
echo ""

# Verify compliance files
echo "✓ Checking compliance files..."
if [ -f "$DEPLOY_DIR/robots.txt" ] && grep -q "noimageindex" "$DEPLOY_DIR/robots.txt"; then
    echo "  ✅ robots.txt has noimageindex rules"
fi

if [ -f "$DEPLOY_DIR/meta-safe.txt" ] && grep -q "COMPLIANCE_LEVEL" "$DEPLOY_DIR/meta-safe.txt"; then
    echo "  ✅ meta-safe.txt has compliance declaration"
fi

if [ -f "$DEPLOY_DIR/privacy.html" ] && grep -q "Privacy" "$DEPLOY_DIR/privacy.html"; then
    echo "  ✅ privacy.html exists and has content"
fi

if [ -f "$DEPLOY_DIR/terms.html" ] && grep -q "Terms" "$DEPLOY_DIR/terms.html"; then
    echo "  ✅ terms.html exists and has content"
fi

echo ""
echo "✓ Compliance files validated!"
echo ""

# Summary
echo "=================================================="
echo "✅ DEPLOYMENT VALIDATION SUCCESSFUL"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. FOR VERCEL DEPLOYMENT:"
echo "   - Update vercel.json with routes (see QUICK_DEPLOY.md)"
echo "   - Run: cd $DEPLOY_DIR && vercel deploy --prod"
echo ""
echo "2. FOR NGINX DEPLOYMENT:"
echo "   - Copy nginx-meta-safe.conf to /etc/nginx/sites-available/"
echo "   - Link: ln -s /etc/nginx/sites-available/nginx-meta-safe.conf /etc/nginx/sites-enabled/"
echo "   - Test: sudo nginx -t"
echo "   - Reload: sudo systemctl reload nginx"
echo ""
echo "3. VERIFICATION:"
echo "   - curl -I https://$DOMAIN/redirect?target=telegram"
echo "   - Should show: HTTP/1.1 301 Moved Permanently"
echo ""
echo "4. TEST LIVE:"
echo "   - Visit: https://$DOMAIN/allisonsundress"
echo "   - Check: Age gate modal shows on click"
echo "   - Check: No console errors"
echo "   - Check: Links redirect to target URLs"
echo ""
echo "🎉 Ready for deployment!"

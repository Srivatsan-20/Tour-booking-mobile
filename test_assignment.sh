#!/bin/bash

# Test Bus Assignment Feature
echo "========================================="
echo "Testing Bus Assignment Feature"
echo "========================================="
echo ""

# Get a fresh token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:5115/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"partner","password":"partner123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi
echo "✅ Got authentication token"
echo ""

# Get list of agreements
echo "2. Fetching agreements..."
AGREEMENTS=$(curl -s "http://localhost:5115/api/agreements" -H "Authorization: Bearer $TOKEN")
echo "✅ Fetched agreements"
echo ""

# Get list of buses
echo "3. Fetching available buses..."
BUSES=$(curl -s "http://localhost:5115/api/buses" -H "Authorization: Bearer $TOKEN")
echo "$BUSES" | python3 -m json.tool
echo ""

# Find an agreement that needs assignment
echo "4. Finding agreements that need bus assignment..."
echo "$AGREEMENTS" | python3 -c "
import sys, json
agreements = json.load(sys.stdin)
for a in agreements:
    assigned = len(a.get('assignedBuses') or [])
    needed = a.get('busCount') or 1
    if assigned < needed and not a.get('isCancelled'):
        print(f\"Agreement: {a['customerName']} (ID: {a['id']})\")
        print(f\"  Needs: {needed} buses, Has: {assigned} buses\")
        print(f\"  From: {a['fromDate']} To: {a['toDate']}\")
        print()
"
echo ""

echo "========================================="
echo "Now open your browser to:"
echo "http://localhost:3000/fleet/assignments"
echo ""
echo "You should see:"
echo "- Pending Deployments section with tours needing buses"
echo "- Active Fleet Status section with assigned buses"
echo "- Click 'Assign Tactical Unit' to assign a bus"
echo "========================================="

# 🎯 DRAG-AND-DROP FEATURE ANALYSIS

## Mobile App: Bus Availability Drag-and-Drop

### ✅ **Feature Confirmed: YES, it exists!**

The mobile app (`BusAvailabilityScreen.tsx`) has a **full drag-and-drop interface** for managing bus assignments and tour dates.

---

## 🎨 How It Works

### **Visual Interface**
- **Calendar Grid View**: Shows all buses (columns) and days (rows) for the selected month
- **Draggable Blocks**: Each tour assignment appears as a colored block that can be dragged
- **Long Press to Activate**: Hold for 220ms to enable dragging
- **Visual Feedback**: Block becomes semi-transparent (0.9 opacity) and elevated (z-index: 50) while dragging

### **Two Types of Drag Actions**

#### 1. **Horizontal Drag: Change Bus Assignment** 🚌➡️🚌
```typescript
// Drag LEFT or RIGHT to move tour to a different bus
if (Math.abs(dx) > Math.abs(dy)) {
    const deltaCols = Math.round(dx / BUS_W);
    onDrop({ type: 'moveBus', targetBusIndex: busIndex + deltaCols });
}
```

**What happens:**
- Drag a tour block horizontally across columns
- Each column represents a different bus
- Automatically unassigns from old bus and assigns to new bus
- Shows confirmation dialog: "Move [Tour] from [Bus A] to [Bus B]?"
- Handles conflicts and rollback if assignment fails

**Example:**
```
Before:  Bus 1: [Chennai Tour]    Bus 2: [Empty]
After:   Bus 1: [Empty]           Bus 2: [Chennai Tour]  ← Dragged right
```

#### 2. **Vertical Drag: Shift Tour Dates** 📅➡️📅
```typescript
// Drag UP or DOWN to shift tour dates
const deltaDays = Math.round(dy / ROW_H);
if (deltaDays !== 0) {
    onDrop({ type: 'shiftDates', deltaDays });
}
```

**What happens:**
- Drag a tour block vertically up or down
- Each row represents one day
- Automatically updates tour's fromDate and toDate
- Shows confirmation dialog: "Shift [Tour] from [Date1-Date2] to [NewDate1-NewDate2]?"
- Updates the entire booking with new dates

**Example:**
```
Before:  Feb 10-12: [Ooty Tour]
After:   Feb 13-15: [Ooty Tour]  ← Dragged down 3 rows (3 days)
```

---

## 🔧 Technical Implementation Details

### **Drag Detection**
```typescript
const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => dragEnabledRef.current,
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }]),
    onPanResponderRelease: (evt, gesture) => {
        // Calculate drop action based on dx/dy
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal = Change Bus
        } else {
            // Vertical = Shift Dates
        }
    }
});
```

### **Confirmation Dialog**
```typescript
// Before applying changes, shows confirmation:
const msg = [
    `Tour: ${customerName}`,
    `Bus: ${fromBus} → ${toBus}`,  // OR
    `Dates: ${oldDates} → ${newDates}`,
    '',
    'Confirm this change?'
].join('\n');

const ok = await confirmChange('Confirm Change', msg);
if (!ok) return; // User cancelled
```

### **Conflict Handling**
```typescript
// If assignment fails (e.g., bus already booked):
try {
    await unassignBusFromAgreement(agreementId, oldBusId);
    await assignBusToAgreement(agreementId, newBusId);
} catch (e) {
    // Rollback: reassign to original bus
    await assignBusToAgreement(agreementId, oldBusId);
    
    // Show conflict details if available
    if (!openConflictsIfAny(e)) {
        Alert.alert('Error', e.message);
    }
}
```

### **Date Shifting Logic**
```typescript
// When dragging vertically:
const from = parseDateDDMMYYYY(agreement.fromDate);
const to = parseDateDDMMYYYY(agreement.toDate);
const newFrom = formatDateDDMMYYYY(addDays(from, deltaDays));
const newTo = formatDateDDMMYYYY(addDays(to, deltaDays));

// Update entire booking with new dates
const updateRequest = toUpdateRequestFromAgreement(agreement, newFrom, newTo);
await updateAgreement(agreementId, updateRequest);
```

---

## 🌐 Web App Status: ❌ **COMPLETELY MISSING**

### Current Web Implementation
- ✅ Has: Bus list, assignment status
- ❌ Missing: Calendar grid view
- ❌ Missing: Drag-and-drop functionality
- ❌ Missing: Visual date/bus management
- ❌ Missing: Quick rescheduling

### What Users See
**Mobile App:**
```
┌─────────────────────────────────────────────────────┐
│  Feb 2026        Bus 1      Bus 2      Bus 3        │
├─────────────────────────────────────────────────────┤
│  Mon 10          [Chennai Tour────]                 │
│  Tue 11          [────────────────]                 │
│  Wed 12                      [Ooty]                 │
│  Thu 13                      [Tour]  [Madurai Tour] │
│  Fri 14                             [─────────────] │
└─────────────────────────────────────────────────────┘
         ↑ Can drag these blocks horizontally or vertically!
```

**Web App:**
```
Just a list of buses and their assignments - no visual calendar
```

---

## 💡 Why This Feature is Important

### **1. Visual Management**
- See entire month at a glance
- Identify scheduling conflicts visually
- Understand bus utilization patterns

### **2. Quick Rescheduling**
- Customer changes dates? Just drag the block up/down
- No need to cancel and recreate booking
- Preserves all booking details (customer, amount, etc.)

### **3. Efficient Bus Swapping**
- Bus breaks down? Drag tour to another bus
- Optimize bus usage by moving tours around
- Balance workload across fleet

### **4. Conflict Prevention**
- Visual feedback shows overlapping bookings
- Can't drop on occupied slots
- Shows which tours conflict

---

## 📊 Implementation Complexity

### **For Web App**

#### **Option 1: Full Drag-and-Drop (High Complexity)**
- **Libraries Needed**: 
  - `react-dnd` or `@dnd-kit/core` for drag-and-drop
  - Calendar grid component
- **Estimated Time**: 2-3 weeks
- **Features**: Exact parity with mobile app

#### **Option 2: Click-Based Alternative (Medium Complexity)**
- **UI**: Calendar grid with click interactions
- Click block → Show menu: "Change Bus" or "Shift Dates"
- Modal dialogs for selecting new bus/dates
- **Estimated Time**: 1 week
- **Features**: Same functionality, different UX

#### **Option 3: Enhanced List View (Low Complexity)**
- **UI**: Improve current list view
- Add "Reschedule" and "Change Bus" buttons to each assignment
- Form-based date/bus selection
- **Estimated Time**: 2-3 days
- **Features**: Functional but less visual

---

## 🎯 Recommended Implementation

### **Phase 1: Add Reschedule & Change Bus Functions** (Quick Win)
```typescript
// Add to /fleet/availability page:

const handleReschedule = async (agreementId: string) => {
    const agreement = await agreementsApi.getById(agreementId);
    // Show modal with date pickers
    // Update agreement with new dates
};

const handleChangeBus = async (agreementId: string, oldBusId: string) => {
    // Show modal with bus selector
    // Unassign from old bus, assign to new bus
};
```

**Benefits:**
- ✅ Achieves same functionality as drag-and-drop
- ✅ Can be implemented quickly (2-3 days)
- ✅ Works well on desktop (better than drag-and-drop)

### **Phase 2: Add Calendar Grid View** (Future Enhancement)
- Build visual calendar component
- Show all assignments in grid
- Click-based interactions (not drag-and-drop initially)

### **Phase 3: Add Drag-and-Drop** (Optional Polish)
- Only if users specifically request it
- Desktop drag-and-drop is less intuitive than mobile
- Click-based may be better UX for web

---

## 📝 Code Example: Quick Reschedule Feature

```typescript
// Add to /web/src/app/fleet/availability/page.tsx

const [rescheduling, setRescheduling] = useState<string | null>(null);
const [newDates, setNewDates] = useState({ from: '', to: '' });

const handleReschedule = async (agreementId: string) => {
    const agreement = await agreementsApi.getById(agreementId);
    setNewDates({ from: agreement.fromDate, to: agreement.toDate });
    setRescheduling(agreementId);
};

const confirmReschedule = async () => {
    if (!rescheduling) return;
    
    try {
        const agreement = await agreementsApi.getById(rescheduling);
        
        // Calculate date shift
        const oldFrom = new Date(agreement.fromDate);
        const newFrom = new Date(newDates.from);
        const daysDiff = Math.round((newFrom - oldFrom) / (1000 * 60 * 60 * 24));
        
        const oldTo = new Date(agreement.toDate);
        const newTo = new Date(oldTo.getTime() + daysDiff * 24 * 60 * 60 * 1000);
        
        // Update agreement
        await agreementsApi.update(rescheduling, {
            ...agreement,
            fromDate: newDates.from,
            toDate: newTo.toISOString().split('T')[0]
        });
        
        alert('Tour rescheduled successfully!');
        loadData();
        setRescheduling(null);
    } catch (error) {
        alert(`Failed to reschedule: ${error.message}`);
    }
};

// In JSX:
<button onClick={() => handleReschedule(assignment.id)}>
    📅 Reschedule Tour
</button>

{rescheduling && (
    <Modal>
        <h3>Reschedule Tour</h3>
        <input 
            type="date" 
            value={newDates.from}
            onChange={e => setNewDates({...newDates, from: e.target.value})}
        />
        <input 
            type="date" 
            value={newDates.to}
            onChange={e => setNewDates({...newDates, to: e.target.value})}
        />
        <button onClick={confirmReschedule}>Confirm</button>
        <button onClick={() => setRescheduling(null)}>Cancel</button>
    </Modal>
)}
```

---

## ✅ Summary

### **Mobile App Has:**
1. ✅ Calendar grid visualization
2. ✅ Drag-and-drop for bus changes (horizontal drag)
3. ✅ Drag-and-drop for date shifts (vertical drag)
4. ✅ Visual conflict detection
5. ✅ Confirmation dialogs
6. ✅ Automatic rollback on errors

### **Web App Has:**
1. ❌ None of the above

### **Priority:**
🔴 **HIGH** - This is a major productivity feature for managing bookings

### **Recommendation:**
Start with **Phase 1** (Reschedule & Change Bus buttons) as a quick win, then add calendar grid view later if needed.

# Modals & Bottom Sheets - Santos Studio UI Components

Modal dialogs for desktop and bottom sheets for mobile, with proper spacing and structure.

## Modal Types

| Type | Platform | Behavior | Use Case |
|------|----------|----------|----------|
| **Modal** | Desktop/Tablet | Centered overlay | Forms, confirmations, detailed content |
| **Bottom Sheet** | Mobile | Slides up from bottom | Mobile-optimized modals |

---

## Desktop Modal

**Purpose:** Display focused content or actions that require user attention.

### Specifications

**Overlay:**
- Background: `rgba(0, 0, 0, 0.5)` (50% black)
- Backdrop blur: `blur(4px)` (optional, for premium feel)
- Click outside to close (optional based on context)

**Modal Container:**
- Background: White (light mode) / Gray-900 (dark mode)
- Border radius: **16-24px** (use 20px as default)
- Shadow: Strong elevation
  ```css
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  ```
- Width: 
  - Small: 400px
  - Medium: 500-600px
  - Large: 700-900px
- Max-height: 90vh (with scroll if needed)

**Spacing:**
- Padding: **24-32px** (use 32px for spacious modals)
- Content spacing: Follow standard spacing scale

**Structure:**
1. **Header**
   - Title: 24px, bold
   - Subtitle (optional): 14px, Gray-600, 6-8px below title
   - Close button: Top-right, 40x40px tap target
   - Spacing below header: **24px**

2. **Content**
   - Main content area
   - Can scroll if content exceeds max-height

3. **Footer (if buttons)**
   - Buttons: Right-aligned or full-width
   - Gap between buttons: **12px**
   - Spacing above footer: **24px**

### Code Example

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Overlay */}
  <div 
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  />
  
  {/* Modal */}
  <div className="
    relative z-10
    bg-white dark:bg-gray-900
    rounded-2xl
    shadow-[0_20px_60px_rgba(0,0,0,0.3)]
    w-full max-w-md max-h-[90vh]
    overflow-hidden
    flex flex-col
  ">
    {/* Header */}
    <div className="p-8 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Confirm Action
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone
          </p>
        </div>
        <button
          onClick={onClose}
          className="
            -mr-2 -mt-2
            w-10 h-10 rounded-lg
            flex items-center justify-center
            text-gray-400 hover:text-gray-600 hover:bg-gray-100
            dark:hover:text-gray-300 dark:hover:bg-gray-800
            transition-all duration-150
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    {/* Content */}
    <div className="flex-1 overflow-y-auto p-8">
      <p className="text-gray-700 dark:text-gray-300">
        Modal content goes here. This area will scroll if content exceeds the maximum height.
      </p>
    </div>
    
    {/* Footer */}
    <div className="p-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary">
          Cancel
        </button>
        <button className="btn-primary">
          Confirm
        </button>
      </div>
    </div>
  </div>
</div>
```

### Animation

**Enter:**
```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-enter {
  animation: modalEnter 200ms ease-out;
}
```

**Exit:**
```css
@keyframes modalExit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

.modal-exit {
  animation: modalExit 150ms ease-in;
}
```

---

## Mobile Bottom Sheet

**Purpose:** Mobile-optimized modal that slides up from bottom.

### Specifications

**Sheet Container:**
- Background: White (light mode) / Gray-900 (dark mode)
- Border radius: **24px top corners only**
- Shadow: Strong upward shadow
  ```css
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
  ```
- Max-height: 90vh
- Position: Fixed to bottom

**Handle Indicator:**
- Width: 40px
- Height: 4px
- Color: Gray-300
- Border radius: Full (9999px)
- Position: Centered, 12px from top
- Purpose: Visual affordance that sheet can be dragged

**Spacing:**
- Padding: **20-24px**
- Top padding: 32px (to account for handle)
- Content spacing: Follow standard scale

### Code Example

```jsx
<div className="fixed inset-0 z-50 flex items-end">
  {/* Overlay */}
  <div 
    className="absolute inset-0 bg-black/50"
    onClick={onClose}
  />
  
  {/* Bottom Sheet */}
  <div className="
    relative z-10 w-full
    bg-white dark:bg-gray-900
    rounded-t-3xl
    shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
    max-h-[90vh]
    overflow-hidden
    flex flex-col
  ">
    {/* Handle */}
    <div className="pt-3 pb-2 flex justify-center">
      <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
    </div>
    
    {/* Header */}
    <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Sheet Title
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Optional description
      </p>
    </div>
    
    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <p className="text-gray-700 dark:text-gray-300">
        Sheet content goes here
      </p>
    </div>
    
    {/* Footer (if needed) */}
    <div className="p-6 border-t border-gray-200 dark:border-gray-800">
      <button className="btn-primary w-full">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Animation

**Slide Up:**
```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-enter {
  animation: slideUp 300ms ease-out;
}
```

**Slide Down:**
```css
@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.sheet-exit {
  animation: slideDown 250ms ease-in;
}
```

---

## Modal Variants

### Confirmation Modal (Small)

```jsx
<div className="w-full max-w-sm p-8">
  <h2 className="text-xl font-bold mb-2">Delete Item?</h2>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
    This action cannot be undone
  </p>
  
  <div className="flex gap-3">
    <button className="btn-secondary flex-1">Cancel</button>
    <button className="btn-primary flex-1 bg-red-500">Delete</button>
  </div>
</div>
```

### Form Modal (Medium)

```jsx
<div className="w-full max-w-md">
  <div className="p-8 border-b border-gray-200">
    <h2 className="text-2xl font-bold">Create New Item</h2>
  </div>
  
  <div className="p-8 space-y-4">
    <Input label="Name" placeholder="Enter name" />
    <Input label="Email" type="email" placeholder="Enter email" />
    <Textarea label="Description" placeholder="Enter description" />
  </div>
  
  <div className="p-8 border-t border-gray-200">
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Create</button>
    </div>
  </div>
</div>
```

### Full-Screen Modal (Large)

For complex content or multi-step flows.

```jsx
<div className="w-full max-w-4xl h-[90vh] flex flex-col">
  {/* Full-height content with internal scroll */}
  <div className="p-8 border-b border-gray-200">
    <h2 className="text-2xl font-bold">Detailed View</h2>
  </div>
  
  <div className="flex-1 overflow-y-auto p-8">
    {/* Scrollable content */}
  </div>
  
  <div className="p-8 border-t border-gray-200">
    <button className="btn-primary">Done</button>
  </div>
</div>
```

---

## Best Practices

### Do's ✅
- Use **24-32px padding** for spacious feel
- Add **backdrop blur** for premium effect (optional)
- Provide **close button** (top-right, 40x40px tap target)
- Use **24px spacing** between header and content
- Add **handle indicator** on bottom sheets (visual affordance)
- Support **Escape key** to close
- Prevent **body scroll** when modal is open
- Use **smooth animations** (200-300ms)

### Don'ts ❌
- Don't use radius below 16px
- Don't skip the overlay background
- Don't make modals too wide (max 900px)
- Don't forget max-height (90vh) with scroll
- Don't skip animations (feels jarring)
- Don't use modals for simple confirmations (use toast/alert instead)
- Don't nest modals (poor UX)

---

## Accessibility

- Trap focus inside modal (Tab cycles through modal elements only)
- Return focus to trigger element when closed
- Support Escape key to close
- Use `role="dialog"` and `aria-modal="true"`
- Use `aria-labelledby` for title
- Use `aria-describedby` for description
- Announce modal opening to screen readers

---

## Complete React Component

```jsx
import React, { useEffect, useRef } from 'react';

const Modal = ({ 
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'medium'
}) => {
  const modalRef = useRef(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-2xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`
          relative z-10
          bg-white dark:bg-gray-900
          rounded-2xl
          shadow-[0_20px_60px_rgba(0,0,0,0.3)]
          w-full ${sizeClasses[size]}
          max-h-[90vh]
          overflow-hidden
          flex flex-col
          animate-in fade-in slide-in-from-bottom-4 duration-200
        `}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 
                id="modal-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="
                -mr-2 -mt-2
                w-10 h-10 rounded-lg
                flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                dark:hover:text-gray-300 dark:hover:bg-gray-800
                transition-all duration-150
              "
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-8 border-t border-gray-200 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

// Usage:
// <Modal
//   isOpen={isOpen}
//   onClose={() => setIsOpen(false)}
//   title="Confirm Action"
//   description="This cannot be undone"
//   footer={
//     <div className="flex gap-3 justify-end">
//       <button className="btn-secondary" onClick={onClose}>Cancel</button>
//       <button className="btn-primary" onClick={onConfirm}>Confirm</button>
//     </div>
//   }
// >
//   Modal content here
// </Modal>
```

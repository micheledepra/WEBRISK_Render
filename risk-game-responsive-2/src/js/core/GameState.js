Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Maintain Separate Codebases or Use a Unified Codebase:**
   - **Separate Codebases:** You can keep the PC version unchanged and create a separate codebase for mobile. This allows you to tailor the experience for each platform but can lead to increased maintenance overhead.
   - **Unified Codebase:** Alternatively, you can use a single codebase that adapts to different platforms. This is often more efficient and easier to maintain.

### 2. **Responsive Design:**
   - **Aspect Ratio and Layout:** Implement a responsive design that adjusts the UI elements based on the screen size. Use relative units (like percentages) instead of fixed units (like pixels) for layout elements.
   - **Dynamic UI Scaling:** Use layout managers or frameworks that support dynamic scaling and repositioning of UI elements based on the device's screen size and resolution.

### 3. **Input Handling:**
   - Ensure that the game can handle different input methods (mouse/keyboard for PC and touch controls for mobile). This may involve creating separate input handling systems or a unified system that can detect the input type.

### 4. **Performance Optimization:**
   - Mobile devices typically have less processing power than PCs. Optimize graphics and performance for mobile without compromising the PC experience.

### 5. **Testing Across Platforms:**
   - Thoroughly test the game on various devices to ensure that the experience is consistent and enjoyable across platforms. Pay attention to UI scaling, input responsiveness, and performance.

### 6. **User Experience Considerations:**
   - Consider how the gameplay experience might differ between platforms. For example, mobile users may prefer shorter play sessions, so you might want to adjust game mechanics accordingly.

### 7. **Cross-Platform Play:**
   - If you want players on different platforms to play together, ensure that the game logic and networking are compatible across devices.

### Confusion and Complexity:
- **User Confusion:** If the game experience is not well-adapted for mobile users (e.g., controls are hard to use, UI is cluttered), it can lead to confusion and frustration.
- **Development Complexity:** Maintaining a cross-platform game can increase complexity, especially if you have to deal with different performance characteristics, input methods, and screen sizes.
- **Testing Overhead:** More platforms mean more testing is required to ensure a consistent experience, which can be time-consuming.

### Conclusion:
While it is entirely feasible to add cross-platform compatibility while keeping the PC version unchanged, careful planning and execution are essential to avoid confusion and ensure a smooth user experience. By focusing on responsive design, input handling, and performance optimization, you can create a game that works well across both PC and mobile platforms.
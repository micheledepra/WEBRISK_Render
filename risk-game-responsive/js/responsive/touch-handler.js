Yes, it is possible to keep the PC version of a game unchanged while adding cross-platform compatibility for mobile devices. Here are some considerations and steps to achieve this:

### 1. **Separate Builds for PC and Mobile:**
   - **Maintain the PC Version:** Keep the existing PC version intact to avoid disrupting the current user experience.
   - **Create a Mobile Version:** Develop a separate build for mobile devices that includes the necessary adjustments for touch controls, screen size, and aspect ratio.

### 2. **Responsive Design:**
   - **Aspect Ratio and Dimensions:** Implement a responsive UI that adjusts based on the screen size. Use relative units (like percentages) instead of fixed pixel values for layout elements.
   - **Dynamic Layouts:** Design the UI to rearrange or resize elements based on the device's screen dimensions. This may involve using layout managers or frameworks that support responsive design.

### 3. **Cross-Platform Compatibility:**
   - **Input Handling:** Adapt controls for touch input on mobile devices while keeping keyboard and mouse controls for PC.
   - **Game Logic:** Ensure that the core game logic remains the same across platforms, but consider platform-specific features (like touch gestures).

### 4. **Testing Across Devices:**
   - **Extensive Testing:** Test the game on various devices to ensure that the experience is consistent and enjoyable across platforms. Pay attention to performance, controls, and UI scaling.

### 5. **User Experience Considerations:**
   - **Consistency:** Maintain a consistent experience in terms of gameplay mechanics and visual style, even if the UI looks different on mobile.
   - **Tutorials and Onboarding:** Provide clear tutorials for mobile users to help them understand the controls and gameplay, especially if they differ from the PC version.

### 6. **Potential Confusion:**
   - **User Expectations:** Players may have different expectations based on the platform they are using. Clear communication about differences in gameplay or controls is essential.
   - **UI Differences:** If the UI is significantly different between platforms, it may confuse players who switch between them. Aim for a balance between adapting to the platform and maintaining familiarity.

### Conclusion:
While it is feasible to add cross-platform compatibility without changing the PC version, careful planning and execution are necessary to ensure a smooth user experience. By focusing on responsive design, consistent gameplay, and thorough testing, you can minimize confusion and create a cohesive experience across platforms.
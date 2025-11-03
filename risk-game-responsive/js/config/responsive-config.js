Yes, it is possible to keep the PC version of a game unchanged while adding cross-platform compatibility for mobile devices. Here are some considerations and steps to achieve this:

### 1. **Separate Builds:**
   - **Maintain Separate Codebases:** You can maintain a separate codebase for the mobile version while keeping the PC version intact. This allows you to make changes specific to mobile without affecting the PC version.
   - **Shared Assets:** Use shared assets where possible to minimize duplication, but keep platform-specific code separate.

### 2. **Responsive Design:**
   - **Aspect Ratio and Layout:** Implement a responsive design that adjusts the aspect ratio and layout based on the screen size. Use flexible UI frameworks or libraries that support responsive design.
   - **Dynamic UI Scaling:** Adjust the size and position of UI elements (like sidebars) dynamically based on the screen resolution and aspect ratio. This can be done using relative positioning and scaling.

### 3. **Cross-Platform Compatibility:**
   - **Input Handling:** Ensure that input methods are compatible across platforms. For example, touch controls for mobile and keyboard/mouse for PC.
   - **Performance Optimization:** Optimize the game for mobile devices, which may have different performance capabilities compared to PCs.

### 4. **User Experience:**
   - **Consistent Experience:** Aim for a consistent user experience across platforms. While the interface may differ, the core gameplay mechanics should remain the same.
   - **Testing:** Conduct thorough testing on both platforms to ensure that the game functions well and is user-friendly on each device.

### 5. **Potential Confusion:**
   - **User Interface Differences:** If the UI is significantly different between platforms, it may confuse players who switch between devices. Try to keep the core elements consistent.
   - **Control Schemes:** Different control schemes can lead to confusion. Provide clear tutorials or guides for each platform.
   - **Performance Expectations:** Players may have different expectations regarding performance and graphics quality on mobile versus PC. Be transparent about these differences.

### Conclusion:
While it is feasible to add cross-platform compatibility and adjust the UI for different screen sizes, careful planning and execution are essential to minimize confusion. By maintaining a clear distinction between the PC and mobile versions while ensuring a consistent core experience, you can create a successful cross-platform game.
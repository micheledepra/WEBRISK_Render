Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can reduce maintenance but may require more complex logic to handle platform-specific features.

### 2. **Responsive Design**
   - **Aspect Ratio and Dimensions**: Implement a responsive design that adjusts the UI elements based on the screen size. This can be achieved using flexible layouts, scaling, and anchoring UI components.
   - **Side Bar Adjustments**: Use relative positioning and scaling for the sidebar and other UI elements to ensure they fit well on different screen sizes.

### 3. **Input Handling**
   - Adapt the input methods for mobile (touch controls) while keeping the PC controls intact (keyboard/mouse). This may involve creating a configuration system that allows players to customize their controls.

### 4. **Performance Optimization**
   - Mobile devices typically have less processing power than PCs. Optimize graphics and performance for mobile without compromising the PC experience.

### 5. **Testing Across Platforms**
   - Extensive testing is crucial to ensure that the game performs well on both PC and mobile. This includes testing for different screen sizes, resolutions, and aspect ratios.

### 6. **User Experience Consistency**
   - Aim for a consistent user experience across platforms. While the controls and UI may differ, the core gameplay mechanics should remain the same.

### 7. **Cross-Platform Features**
   - Implement features that allow players to interact across platforms, such as shared accounts, cross-save functionality, and multiplayer capabilities.

### Potential Confusion
- **User Confusion**: If the game has significantly different mechanics or UI on different platforms, players may become confused. Clear communication about the differences and similarities is essential.
- **Development Complexity**: Managing different UI layouts and input methods can increase the complexity of development. Proper planning and modular design can help mitigate this.
- **Testing Overhead**: More platforms mean more testing scenarios, which can be time-consuming and may require additional resources.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are necessary to ensure a smooth experience for players on both platforms. By focusing on responsive design, consistent user experience, and thorough testing, you can minimize confusion and create a successful cross-platform game.
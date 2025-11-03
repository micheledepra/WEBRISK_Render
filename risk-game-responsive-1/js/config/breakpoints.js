Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Unified Codebase**: You can maintain a single codebase that adapts to different platforms. This approach can simplify updates and maintenance but may require additional work to ensure that platform-specific features are handled correctly.
   - **Separate Codebase**: Alternatively, you can keep the PC version unchanged and create a separate version for mobile. This can lead to more confusion and duplication of effort, especially when implementing updates or new features.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use flexible layouts (like grids or flexbox) that can adapt to different aspect ratios.
   - **Dynamic UI Scaling**: Ensure that UI elements, including sidebars, scale appropriately. This may involve using relative units (like percentages) instead of fixed units (like pixels).

### 3. **Input Handling**
   - **Touch vs. Mouse Input**: Adapt the input handling to accommodate touch controls for mobile devices while keeping mouse and keyboard controls for PC. This may require creating different input schemes or control layouts.

### 4. **Performance Optimization**
   - Mobile devices typically have less processing power than PCs, so you may need to optimize graphics, reduce asset sizes, and streamline code to ensure smooth performance on mobile.

### 5. **Testing Across Platforms**
   - Extensive testing is crucial to ensure that the game functions correctly on both PC and mobile devices. This includes checking for UI scaling, input responsiveness, and overall gameplay experience.

### 6. **User Experience Considerations**
   - **Consistency**: Aim for a consistent user experience across platforms, but be mindful of the differences in interaction methods and screen sizes.
   - **Tutorials and Onboarding**: Consider how you will guide users through the game on different platforms, especially if the controls or UI differ significantly.

### 7. **Potential Confusion**
   - **User Confusion**: If the game experience differs significantly between platforms (e.g., different controls, UI layouts), players may become confused. Clear communication about the differences and how to navigate them is essential.
   - **Development Complexity**: Maintaining a cross-platform game can increase development complexity, especially if you need to address platform-specific bugs or features.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are necessary to minimize confusion for both players and developers. A well-thought-out approach to responsive design, input handling, and user experience will help create a seamless experience across platforms.
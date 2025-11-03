Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Maintain Separate Codebases or Use a Unified Codebase**
   - **Separate Codebases**: You can keep the PC version unchanged and create a separate codebase for mobile. This allows you to tailor the mobile experience without affecting the PC version.
   - **Unified Codebase**: Alternatively, you can use a single codebase that adapts to different platforms. This approach can reduce maintenance overhead but may require more complex conditional logic to handle platform-specific features.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use relative units (like percentages) instead of fixed units (like pixels) for layout dimensions.
   - **Dynamic UI Scaling**: Use layout managers or frameworks that support dynamic scaling to ensure that the game looks good on various screen sizes and aspect ratios.

### 3. **Input Handling**
   - **Touch vs. Mouse Input**: Implement different input handling for touch screens and mouse/keyboard. This may involve creating touch-friendly controls for mobile while keeping the traditional controls for PC.

### 4. **Cross-Platform Compatibility**
   - **Networking**: If the game has multiplayer features, ensure that the networking code supports cross-platform play. This may involve using a common server architecture that can handle connections from both PC and mobile clients.
   - **Performance Optimization**: Mobile devices typically have less processing power than PCs, so optimize performance for mobile without compromising the PC experience.

### 5. **Testing and Quality Assurance**
   - **Extensive Testing**: Test the game on various devices and screen sizes to ensure that the user experience is consistent and enjoyable across platforms.
   - **User Feedback**: Gather feedback from users on both platforms to identify any confusion or usability issues.

### 6. **Potential Confusion**
   - **User Experience**: If the game mechanics or UI differ significantly between platforms, it could confuse players. Aim for a consistent experience across platforms while adapting controls and layouts.
   - **Feature Parity**: Decide whether all features will be available on both platforms. If not, clearly communicate any differences to users.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are essential to minimize confusion and ensure a smooth user experience. By focusing on responsive design, input handling, and thorough testing, you can create a cross-platform game that appeals to both PC and mobile players.
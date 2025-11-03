Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: Maintain a distinct version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Use a single codebase that can adapt to different platforms. This is often more efficient and easier to maintain.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use flexible layouts (like grids or flexbox) that can rearrange or resize components dynamically.
   - **Side Bar Adjustments**: Ensure that the sidebar and other UI elements can scale or reposition based on the device's screen size. This may involve using relative units (like percentages) instead of fixed units (like pixels).

### 3. **Input Handling**
   - Adapt the input methods for mobile (touch controls) while keeping the PC controls intact (keyboard/mouse). This may involve creating a settings menu where players can customize their controls.

### 4. **Performance Optimization**
   - Mobile devices typically have less processing power than PCs. Optimize graphics and performance for mobile without compromising the PC experience.

### 5. **Testing Across Devices**
   - Thoroughly test the game on various devices to ensure that the experience is consistent and enjoyable across platforms. This includes checking for UI scaling, performance, and input responsiveness.

### 6. **User Experience Considerations**
   - Ensure that the game’s mechanics and user interface are intuitive on both platforms. This may involve simplifying certain features for mobile users or providing tutorials.

### 7. **Cross-Platform Play**
   - If the game supports multiplayer, ensure that players on different platforms can interact seamlessly. This may require additional backend support.

### Confusion and Complexity
- **User Confusion**: If not implemented carefully, users may find the experience confusing, especially if the UI behaves differently on different platforms. Clear communication about controls and features is essential.
- **Development Complexity**: Maintaining a cross-platform game can increase complexity in development, especially when dealing with platform-specific bugs or performance issues. Proper planning and architecture can mitigate this.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, it requires careful planning and execution. The key is to ensure a consistent user experience across platforms while optimizing for the strengths and limitations of each device. With the right approach, you can create a game that is enjoyable on both PC and mobile without causing confusion for players.
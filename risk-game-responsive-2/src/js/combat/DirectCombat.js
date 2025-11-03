Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can simplify updates and maintenance. Frameworks like Unity or Unreal Engine support cross-platform development.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use relative positioning and scaling to ensure that the game looks good on both PC and mobile.
   - **Dynamic UI**: Create a dynamic UI that can rearrange or resize elements based on the device's screen dimensions. This may involve using layout managers or flexible UI frameworks.

### 3. **Input Handling**
   - **Control Schemes**: Adapt the control scheme for mobile devices (touch controls) while keeping the PC controls (keyboard/mouse) unchanged. This may require implementing different input systems that can switch based on the platform.

### 4. **Cross-Platform Compatibility**
   - **Networking**: If your game has multiplayer features, ensure that the networking code supports cross-platform play. This may involve using a service that facilitates cross-platform matchmaking.
   - **Performance Optimization**: Mobile devices have different performance characteristics than PCs. Optimize graphics and processing to ensure smooth gameplay on both platforms.

### 5. **Testing and Quality Assurance**
   - **Extensive Testing**: Test the game on various devices to ensure that the experience is consistent and enjoyable across platforms. Pay attention to UI scaling, performance, and input responsiveness.

### 6. **User Experience Considerations**
   - **Consistency**: Ensure that the core gameplay experience remains consistent across platforms. Players should feel familiar with the game regardless of the device they are using.
   - **Tutorials and Onboarding**: Provide tutorials or onboarding experiences that help users understand the controls and UI differences between platforms.

### Potential Confusion
- **User Experience**: If not implemented carefully, users may find the experience confusing if the UI or controls differ significantly between platforms. Clear communication and consistent design can mitigate this.
- **Performance Expectations**: Players may have different expectations for performance and graphics quality based on their device. Managing these expectations through marketing and in-game messaging is important.

### Conclusion
While adding cross-platform compatibility and adjusting the UI for different screen sizes can be complex, it is certainly achievable with careful planning and execution. The key is to maintain a consistent user experience while optimizing for the strengths and limitations of each platform.
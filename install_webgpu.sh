#!/bin/bash
# install_webgpu.sh
#
# This script will:
#   1. Update your package lists.
#   2. Install essential packages (build-essential, cmake, git, libglfw3-dev).
#   3. Create a project directory "webgpu_sample" in your home directory.
#   4. Write sample "main.cpp" and "CMakeLists.txt" files.
#   5. Initialize a git repository and add Dawn as a submodule.
#   6. Create the build directory, build the app and then run it.
#
# NOTE: This sample project uses synchronous (blocking) adapter/device requests.
#       In production, WebGPU’s asynchronous nature must be handled appropriately.

set -e

echo "Updating package lists..."
sudo apt-get update

echo "Installing required packages: build-essential, cmake, git, libglfw3-dev..."
sudo apt-get install -y build-essential cmake git libglfw3-dev

# Create project directory
PROJECT_DIR=~/webgpu_sample
echo "Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "Writing main.cpp..."
cat > main.cpp << 'EOF'
#include <iostream>
#include <GLFW/glfw3.h>
#include <webgpu/webgpu_cpp.h>
#include <webgpu/webgpu_glfw.h>

// Window dimensions.
const uint32_t kWidth = 512;
const uint32_t kHeight = 512;

// Global variables.
wgpu::Instance instance;
wgpu::Adapter adapter;
wgpu::Device device;
wgpu::Surface surface;
wgpu::TextureFormat format;
wgpu::RenderPipeline pipeline;
GLFWwindow* window = nullptr;

// WGSL shader code that draws a red triangle.
const char shaderCode[] = R"(
    @vertex fn vertexMain(@builtin(vertex_index) i : u32) -> @builtin(position) vec4f {
      const positions = array<vec2f, 3>(
          vec2f(0.0,  0.5),
          vec2f(-0.5, -0.5),
          vec2f(0.5, -0.5)
      );
      return vec4f(positions[i], 0.0, 1.0);
    }
    @fragment fn fragmentMain() -> @location(0) vec4f {
      return vec4f(1.0, 0.0, 0.0, 1.0);
    }
)";

// Configures the swapchain for the surface.
void ConfigureSurface() {
    wgpu::SurfaceCapabilities capabilities;
    surface.GetCapabilities(adapter, &capabilities);
    format = capabilities.formats[0];
    wgpu::SurfaceConfiguration config = {};
    config.device = device;
    config.format = format;
    config.width = kWidth;
    config.height = kHeight;
    surface.Configure(&config);
}

// Creates a render pipeline with the provided shader.
void CreateRenderPipeline() {
    wgpu::ShaderModuleWGSLDescriptor wgslDesc = {};
    wgslDesc.code = shaderCode;
    wgpu::ShaderModuleDescriptor shaderModuleDesc = {};
    shaderModuleDesc.nextInChain = &wgslDesc;
    wgpu::ShaderModule shaderModule = device.CreateShaderModule(&shaderModuleDesc);

    wgpu::ColorTargetState colorTargetState = {};
    colorTargetState.format = format;

    wgpu::FragmentState fragmentState = {};
    fragmentState.module = shaderModule;
    fragmentState.entryPoint = "fragmentMain";
    fragmentState.targetCount = 1;
    fragmentState.targets = &colorTargetState;

    wgpu::RenderPipelineDescriptor pipelineDesc = {};
    pipelineDesc.vertex.module = shaderModule;
    pipelineDesc.vertex.entryPoint = "vertexMain";
    pipelineDesc.vertex.bufferCount = 0;
    pipelineDesc.fragment = &fragmentState;
    pipelineDesc.layout = nullptr;
    pipeline = device.CreateRenderPipeline(&pipelineDesc);
}

// Render a single frame.
void Render() {
    wgpu::SurfaceTexture surfaceTexture;
    surface.GetCurrentTexture(&surfaceTexture);

    wgpu::RenderPassColorAttachment attachment = {};
    attachment.view = surfaceTexture.texture.CreateView();
    attachment.loadOp = wgpu::LoadOp::Clear;
    attachment.storeOp = wgpu::StoreOp::Store;
    float clearColor[4] = {0, 0, 0, 1};
    attachment.clearColor = { clearColor[0], clearColor[1], clearColor[2], clearColor[3] };

    wgpu::RenderPassDescriptor renderPassDesc = {};
    renderPassDesc.colorAttachmentCount = 1;
    renderPassDesc.colorAttachments = &attachment;

    wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
    wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&renderPassDesc);
    pass.SetPipeline(pipeline);
    pass.Draw(3);
    pass.End();

    wgpu::CommandBuffer commands = encoder.Finish(nullptr);
    device.GetQueue().Submit(1, &commands);

    surfaceTexture.Present();
}

// Basic initialization for the GPU.
bool InitWebGPU() {
    instance = wgpu::CreateInstance();
    instance.RequestAdapter(nullptr,
        [](WGPURequestAdapterStatus status, WGPUAdapter cAdapter, const char* message, void*) {
            if (status != WGPURequestAdapterStatus_Success) {
                std::cerr << "Request adapter failed: " << (message ? message : "unknown") << std::endl;
                exit(1);
            }
            adapter = wgpu::Adapter::Acquire(cAdapter);
        }, nullptr);
    adapter.RequestDevice(nullptr,
        [](WGPURequestDeviceStatus status, WGPUDevice cDevice, const char* message, void*) {
            if (status != WGPURequestDeviceStatus_Success) {
                std::cerr << "Request device failed: " << (message ? message : "unknown") << std::endl;
                exit(1);
            }
            device = wgpu::Device::Acquire(cDevice);
            device.SetUncapturedErrorCallback([](WGPUErrorType type, const char* message, void*) {
                std::cerr << "Device error: " << message << std::endl;
            }, nullptr);
        }, nullptr);
    return true;
}

// Initialize GLFW window and create a surface.
void InitWindowAndSurface() {
    if (!glfwInit()) {
        std::cerr << "GLFW initialization failed." << std::endl;
        exit(1);
    }
    glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);
    window = glfwCreateWindow(kWidth, kHeight, "WebGPU Test App", nullptr, nullptr);
    if (!window) {
        std::cerr << "Failed to create GLFW window." << std::endl;
        exit(1);
    }
    surface = wgpu::glfw::CreateSurfaceForWindow(instance, window);
}

int main() {
    InitWindowAndSurface();
    InitWebGPU();
    ConfigureSurface();
    CreateRenderPipeline();

    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        Render();
    }

    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}
EOF

echo "Writing CMakeLists.txt..."
cat > CMakeLists.txt << 'EOF'
cmake_minimum_required(VERSION 3.13)
project(app)

set(CMAKE_CXX_STANDARD 20)

add_executable(app main.cpp)

# Enable Dawn dependencies.
set(DAWN_FETCH_DEPENDENCIES ON)
add_subdirectory(dawn EXCLUDE_FROM_ALL)
target_link_libraries(app PRIVATE dawn::webgpu_dawn glfw webgpu_glfw)
EOF


echo "Initializing git repository and adding Dawn as a submodule..."
git init
git submodule add https://dawn.googlesource.com/dawn dawn


echo "Creating build directory, configuring and building the project..."
mkdir -p build && cd build
cmake ..
cmake --build .


echo "Running the app..."
./app

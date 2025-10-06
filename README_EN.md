# MCP Package Manager

An intelligent AI development team management system that integrates 9 MCP servers and 6 AI roles to provide comprehensive project development solutions.

## 🚀 Features

### MCP Server Integration
- **CodeBuddy CN Agent**: AI development team collaboration system
- **Playwright**: Web automation testing and browser control
- **Context7**: Documentation retrieval and knowledge management
- **Sequential Thinking**: Multi-step problem solving and analysis
- **Spec Workflow**: Specification-driven development workflow
- **Steering Guide**: Project architecture and steering documentation
- **Approvals**: Approval management and workflow control
- **CodeBuddy Workflow**: AI-powered project workflow management
- **Document Generation**: Automated document creation and management

### AI Development Team Roles
1. **Tech Lead**: Requirements analysis, architecture design, task allocation
2. **Product Manager**: PRD writing and priority management
3. **UI Designer**: Interface mockups and design specifications
4. **Frontend Developer**: Compilable page code generation
5. **Backend Developer**: RESTful APIs and database design
6. **Test Engineer**: Test cases and bug tracking

## 📦 Installation

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Quick Install
```bash
# Clone the repository
git clone https://github.com/wuxiaolong123121/mcp-package-manager.git
cd mcp-package-manager

# Install dependencies
npm install

# Build the project
npm run build

# Install globally for MCP server usage
npm install -g .
```

## 🔧 Usage

### As a CLI Tool
```bash
# Start the interactive CLI
npm run dev

# Or use the global command
codebuddy
```

### As an MCP Server
```bash
# Start the MCP server
npm run mcp

# Or use the global command
codebuddy-mcp
```

### Docker Deployment
```bash
# Build the Docker image
docker build -t mcp-package-manager .

# Run the container
docker run -it --rm mcp-package-manager
```

## 🛠️ MCP Tools

The MCP server provides the following tools:

### Core AI Role Tools
- `tech_lead_analyze`: Technical lead analysis and architecture
- `product_manager_write_prd`: Product manager PRD generation
- `ui_designer_design`: UI designer mockup creation
- `frontend_dev_code`: Frontend developer code generation
- `backend_dev_api`: Backend developer API design
- `test_engineer_plan`: Test engineer test planning
- `run_full_workflow`: One-click full workflow execution

### Role Management
- `get_available_roles`: List all available AI roles
- `activate_role`: Activate a specific AI role
- `get_role_capabilities`: Get role capabilities

### Workflow Management
- `create_workflow`: Create new project workflow
- `get_workflow_status`: Get current workflow status
- `execute_workflow_step`: Execute next workflow step
- `get_workflow_report`: Get workflow execution report

### Document Generation
- `generate_document`: Generate project documents
- `get_document_templates`: Get available document templates

### MCP Client Management
- `get_mcp_servers_status`: Get all MCP server status
- `get_available_mcp_tools`: Get all available MCP tools
- `call_mcp_tool`: Call specific MCP tool
- `reload_mcp_servers`: Reload MCP server configuration

## 📋 Example Usage

### One-Click Project Development
```bash
# Start a complete project workflow with a single idea
codebuddy-mcp

# Then call the run_full_workflow tool with your idea:
# Tool: run_full_workflow
# Parameters: {"idea": "Create a modern e-commerce website with shopping cart and payment integration"}
```

### Individual Role Activation
```bash
# Activate specific roles for targeted tasks
# Tool: tech_lead_analyze
# Parameters: {"requirement": "Design a scalable microservices architecture for a social media platform"}

# Tool: product_manager_write_prd  
# Parameters: {"requirement": "Write a PRD for a mobile banking app with biometric authentication"}

# Tool: frontend_dev_code
# Parameters: {"requirement": "Create a responsive dashboard with charts and data visualization"}
```

## 🏗️ Project Structure

```
mcp-package-manager/
├── src/
│   ├── cli/           # CLI interface
│   ├── core/          # Core functionality
│   ├── mcp/           # MCP server implementation
│   ├── roles/         # AI role definitions
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── docs/              # Documentation
├── tests/             # Test files
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
├── Dockerfile         # Docker configuration
└── README.md          # This file
```

## 🔧 Configuration

### MCP Configuration
Create a `mcp.json` file to configure MCP servers:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@mcp/playwright"],
      "enabled": true
    },
    "context7": {
      "command": "npx",
      "args": ["@mcp/context7"],
      "enabled": true
    }
  }
}
```

### Environment Variables
```bash
# Development mode
NODE_ENV=development

# Log level
LOG_LEVEL=info

# MCP server port (if applicable)
MCP_PORT=3000
```

## 🧪 Development

### Development Setup
```bash
# Install development dependencies
npm install

# Start development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Building
```bash
# Build the project
npm run build

# Build and run MCP server
npm run mcp:build
```

## 📚 Documentation

- [中文文档](./README.md) (Chinese Documentation)
- [API Reference](./docs/api.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Model Context Protocol (MCP) team for the excellent SDK
- All contributors and users of this project
- The AI development community for continuous inspiration

## 📞 Support

For support and questions:
- 📧 Email: [your-email@example.com]
- 💬 Discord: [your-discord-server]
- 🐛 Issues: [GitHub Issues](https://github.com/wuxiaolong123121/mcp-package-manager/issues)

---

**Star ⭐ this repository if you find it helpful!**
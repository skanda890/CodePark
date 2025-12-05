# Welcome to CodePark!

CodePark is a comprehensive project management and collaboration platform designed to streamline workflows and enhance team productivity. It offers a range of features, including user authentication, a customizable dashboard, project management tools, real-time collaboration, version control integration, CI/CD pipelines, code review tools, detailed documentation, API management, analytics and reporting, notifications, customizable themes, mobile support, robust security features, and integration with popular third-party tools like Slack and JIRA.

With CodePark, teams can efficiently manage projects, track progress, collaborate in real-time, and ensure code quality through integrated version control and code review processes. The platform's user-friendly interface and extensive feature set make it ideal for developers and project managers looking to optimize their workflows and improve overall productivity.

---

## 🔄 Automated Dependency Updates

**NEW**: CodePark now features an automated daily dependency update system that keeps your project on the bleeding edge!

### Features

- ✅ **Daily Automatic Updates** to latest pre-release versions
- ✅ **Smart Backup System** with 7-day retention
- ✅ **Automatic Rollback** on installation failure
- ✅ **Security Auditing** after each update
- ✅ **Comprehensive Logging** with color-coded severity
- ✅ **Windows Task Scheduler** integration
- ✅ **Dry-run Mode** for testing

### Quick Setup (Windows)

```powershell
# Open PowerShell as Administrator
cd C:\path\to\CodePark\Coding\Scripts\auto-update
.\setup-windows-task.ps1
```

That's it! Your dependencies will now update daily at 2:00 AM.

### Documentation

- **Quick Start**: [`Coding/Scripts/auto-update/QUICKSTART.md`](Coding/Scripts/auto-update/QUICKSTART.md)
- **Full Documentation**: [`Coding/Scripts/auto-update/README.md`](Coding/Scripts/auto-update/README.md)
- **Windows Setup**: [`Coding/Scripts/auto-update/setup-windows-task.ps1`](Coding/Scripts/auto-update/setup-windows-task.ps1)
- **Update Script**: [`Coding/Scripts/auto-update/update-dependencies.ps1`](Coding/Scripts/auto-update/update-dependencies.ps1)

### What Gets Updated

All dependencies are updated to their `next` (pre-release) versions:

- `axios` - HTTP client
- `express` - Web framework
- `mongodb` - Database driver
- `nodemailer` - Email sender
- `systeminformation` - System metrics
- `@tolgee/cli` - i18n tooling

**Note**: This project intentionally uses bleeding-edge pre-release versions. Production deployments should use stable versions.

---

## 🛠️ Development

### Installation

```bash
# Clone the repository
git clone https://github.com/skanda890/CodePark.git
cd CodePark

# Install dependencies
npm install

# Start development server
npm start
```

### Scripts

```bash
npm start          # Start the application
npm test           # Run tests
npm run build      # Build for production
```

---

## 📚 Documentation

For detailed documentation on features and setup, check the following:

- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [Auto-Update Documentation](Coding/Scripts/auto-update/README.md) - Automated dependency updates

---

## 🔒 Security

CodePark takes security seriously:

- 🔐 User authentication and authorization
- 🔒 Secure API endpoints
- 🔍 Regular security audits via automated updates
- 🛡️ Vulnerability scanning

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- How to submit pull requests
- Coding standards

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Repository**: [github.com/skanda890/CodePark](https://github.com/skanda890/CodePark)
- **Issues**: [github.com/skanda890/CodePark/issues](https://github.com/skanda890/CodePark/issues)
- **Discussions**: [github.com/skanda890/CodePark/discussions](https://github.com/skanda890/CodePark/discussions)

---

**Made with ❤️ by SkandaBT**

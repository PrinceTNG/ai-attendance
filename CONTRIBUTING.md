# Contributing to AI-Powered Attendance System

First off, thank you for considering contributing to this project! 🎉

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots or animated GIFs** if possible
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** used throughout the project
3. **Write clear, descriptive commit messages**
4. **Update documentation** as needed
5. **Test your changes** thoroughly
6. **Open a Pull Request** with a clear title and description

## 💻 Development Process

### Setting Up Your Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-attendance.git
cd ai-attendance

# Install dependencies
npm install
cd server && npm install && cd ..

# Setup environment variables
cp .env.example .env
cp server/.env.example server/.env

# Setup database
# Import server/database/schema.sql into MySQL

# Run the application
npm run dev          # Terminal 1 - Frontend
npm run server       # Terminal 2 - Backend
```

### Coding Standards

- **JavaScript/TypeScript**: Follow ESLint rules
- **React**: Use functional components and hooks
- **Naming**: Use clear, descriptive names (camelCase for variables, PascalCase for components)
- **Comments**: Write meaningful comments for complex logic
- **File Structure**: Keep files organized and modular

### Commit Message Guidelines

Follow the conventional commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add JWT token refresh functionality
fix(attendance): resolve timezone issue in clock-in
docs(readme): update installation instructions
```

### Testing

- Test your changes across different browsers
- Verify facial recognition works properly
- Check responsive design on mobile devices
- Test AI chatbot responses
- Verify database operations

## 📝 Style Guide

### JavaScript/TypeScript

```javascript
// Good
const fetchUserData = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

// Bad
const fetch_data = function(id) {
  return api.get('/users/'+id).then(r=>r.data).catch(e=>{throw e});
};
```

### React Components

```typescript
// Good
interface UserProfileProps {
  userId: string;
  onUpdate: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);
  
  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
};
```

## 🌿 Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

## 🔍 Code Review Process

1. **All pull requests** require at least one review
2. **Address review comments** promptly
3. **Keep discussions professional** and constructive
4. **Be patient** - reviews may take time

## 📚 Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)

## ❓ Questions?

Feel free to reach out:

- **Email**: mthethwaprince10@gmail.com
- **LinkedIn**: [Prince Mthethwa](https://www.linkedin.com/in/prince-mthethwa-454b95316/)
- **GitHub Issues**: [Create an issue](https://github.com/PrinceTNG/ai-attendance/issues)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

✅ Being respectful of differing viewpoints and experiences
✅ Gracefully accepting constructive criticism
✅ Focusing on what is best for the community
✅ Showing empathy towards other community members

**Examples of unacceptable behavior:**

❌ Trolling, insulting/derogatory comments, and personal attacks
❌ Public or private harassment
❌ Publishing others' private information without explicit permission
❌ Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at mthethwaprince10@gmail.com.

---

**Thank you for contributing! 🙏**

Your contributions help make this project better for everyone.

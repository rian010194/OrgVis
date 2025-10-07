# Organization Visualization Tool

A modern, interactive web application for visualizing and managing organizational structures. Built with vanilla JavaScript, D3.js, and Supabase, this tool provides an intuitive interface for exploring hierarchical data through tree views, interactive maps, and detailed analytics.

## 🌟 Features

### 📊 **Interactive Visualizations**
- **Tree View**: Hierarchical navigation with expandable/collapsible nodes
- **Map View**: D3.js-powered force-directed graph visualization with zoom and pan
- **Detail Panel**: Comprehensive node information with metrics and relationships
- **Profile Panel**: User profile management with statistics and activity tracking

### 🎨 **Customization & Branding**
- **Theme Editor**: Customize colors, fonts, logos, and organization branding
- **Multi-Organization Support**: Manage multiple organizations with separate themes
- **Real-time Theme Updates**: Changes apply immediately across the application
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 🔧 **Administrative Tools**
- **Node Management**: Create, edit, and delete organizational nodes
- **Relationship Mapping**: Define and visualize connections between nodes
- **Metrics & Analytics**: Track KPIs and performance indicators with interactive charts
- **User Management**: Role-based access control and user administration
- **Resources Management**: Organize and manage organizational resources

### 📱 **Mobile-First Design**
- **Touch-Optimized**: Large touch targets and intuitive gestures
- **Responsive Layout**: Adapts seamlessly to different screen sizes
- **Mobile View Toggle**: Collapsible tree/map view for better mobile experience
- **Compact Navigation**: Efficient use of screen real estate with hamburger menu
- **Fullscreen Mode**: Immersive detail panel view on mobile devices

### 🚨 **User Experience**
- **Warning Banner**: Real-time notifications about known issues
- **Known Issues Page**: Comprehensive documentation of current limitations
- **Error Handling**: Graceful fallbacks and user-friendly error messages

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for local development)
- Supabase account (for production)

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd Organisation

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Setup
1. Set up a Supabase project
2. Run the database schema: `supabase/database_schema.sql`
3. Configure environment variables
4. Deploy to your preferred hosting platform

## 📁 Project Structure

```
Organisation/
├── index.html              # Main application entry point
├── known-issues.html       # Known issues documentation page
├── css/
│   ├── style.css          # Main stylesheet with responsive design
│   └── user-management.css # User management specific styles
├── js/
│   ├── app.js             # Application initialization and view management
│   ├── ui.js              # UI logic and event handling
│   ├── data.js            # Data management and localStorage
│   ├── map.js             # D3.js map visualization with zoom/pan
│   ├── supabase-multi-org.js        # Supabase integration with multi-org support
│   ├── theme-editor-supabase.js     # Theme customization with Supabase
│   ├── warning-banner.js  # Warning banner system for known issues
│   └── landing.js         # Landing page functionality
├── supabase/
│   ├── database_schema.sql    # Main database schema
│   ├── demo_data.sql          # Sample organizational data
│   ├── user_management_schema.sql # User management tables
│   ├── migrations/            # Database migrations
│   └── config.toml           # Supabase configuration
├── docs/                   # Documentation
│   ├── index.md           # Documentation index
│   ├── quick-start.md     # Quick start guide
│   ├── setup-guide.md     # Detailed setup instructions
│   ├── supabase-setup.md  # Supabase configuration guide
│   ├── deployment-strategy.md # Deployment options
│   └── user-management-guide.md # User management setup
├── templates/              # Import/export templates
└── netlify.toml           # Netlify deployment configuration
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: D3.js v7
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Deployment**: Netlify, Vercel, or any static hosting

## 📖 Documentation

- [Supabase Setup Guide](docs/supabase-setup.md)
- [User Management Guide](docs/user-management-guide.md)
- [Deployment Strategy](docs/deployment-strategy.md)
- [Quick Start Guide](docs/quick-start.md)
- [Collaboration Guide](docs/collaboration-guide.md)

## 🎯 Key Capabilities

### Organization Management
- Create and manage organizational hierarchies
- Define relationships between departments, teams, and individuals
- Track organizational metrics and KPIs
- Export/import organizational data

### Visualization Features
- Interactive tree navigation with search functionality
- Force-directed graph visualization with zoom and pan
- Responsive design that works on all devices
- Customizable themes and branding

### Data Management
- Real-time synchronization with Supabase
- Local storage fallback for offline functionality
- CSV import/export capabilities
- Version control and data backup

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Customization
- Modify `css/style.css` for styling changes
- Update `js/config.js` for application settings
- Customize themes through the built-in theme editor

## 📱 Mobile Optimization

The application is fully optimized for mobile devices with:
- Touch-friendly interface elements
- Responsive grid layouts
- Optimized font sizes and spacing
- Gesture-based navigation
- Compact admin panels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review the [collaboration guide](docs/collaboration-guide.md)
- Open an issue on GitHub

## 🗺️ Roadmap

### ✅ Completed Features
- [x] Interactive tree and map visualizations
- [x] Mobile-responsive design with touch optimization
- [x] Theme customization and branding system
- [x] Multi-organization support
- [x] Admin panel with node management
- [x] Warning banner and known issues system
- [x] Profile panel for user management
- [x] Supabase integration with real-time updates

### 🚧 In Progress
- [ ] Advanced analytics dashboard
- [ ] Enhanced user permissions system
- [ ] Real-time collaboration features

### 📋 Planned Features
- [ ] API integration capabilities
- [ ] Mobile app development
- [ ] Integration with HR systems
- [ ] Advanced reporting and export features
- [ ] Workflow automation tools

---

**Built with ❤️ for modern organizational management**

**Last updated**: October 2025
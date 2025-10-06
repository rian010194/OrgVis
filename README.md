# Organization Visualization Tool

A modern, interactive web application for visualizing and managing organizational structures. Built with vanilla JavaScript, D3.js, and Supabase, this tool provides an intuitive interface for exploring hierarchical data through tree views, interactive maps, and detailed analytics.

## 🌟 Features

### 📊 **Interactive Visualizations**
- **Tree View**: Hierarchical navigation with expandable/collapsible nodes
- **Map View**: D3.js-powered force-directed graph visualization
- **Detail Panel**: Comprehensive node information with metrics and relationships

### 🎨 **Customization & Branding**
- **Theme Editor**: Customize colors, fonts, and branding
- **Responsive Design**: Optimized for desktop and mobile devices
- **Multi-Organization Support**: Manage multiple organizations with separate branding

### 🔧 **Administrative Tools**
- **Node Management**: Create, edit, and delete organizational nodes
- **Relationship Mapping**: Define and visualize connections between nodes
- **Metrics & Analytics**: Track KPIs and performance indicators
- **User Management**: Role-based access control

### 📱 **Mobile-First Design**
- **Touch-Optimized**: Large touch targets and intuitive gestures
- **Responsive Layout**: Adapts seamlessly to different screen sizes
- **Compact Navigation**: Efficient use of screen real estate

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
├── css/
│   ├── style.css          # Main stylesheet with responsive design
│   └── user-management.css # User management specific styles
├── js/
│   ├── app.js             # Application initialization and view management
│   ├── ui.js              # UI logic and event handling
│   ├── data.js            # Data management and localStorage
│   ├── map.js             # D3.js map visualization
│   ├── supabase-multi-org.js        # Supabase integration with multi-org support
│   └── theme-editor.js    # Theme customization functionality
├── supabase/
│   ├── database_schema.sql    # Main database schema
│   ├── demo_data.sql          # Sample organizational data
│   ├── user_management_schema.sql # User management tables
│   └── migrations/            # Database migrations
├── docs/                   # Documentation
│   ├── supabase-setup.md  # Supabase configuration guide
│   ├── deployment-strategy.md # Deployment options
│   └── user-management-guide.md # User management setup
└── templates/              # Import/export templates
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

- [ ] Advanced analytics dashboard
- [ ] Real-time collaboration features
- [ ] API integration capabilities
- [ ] Advanced user permissions
- [ ] Mobile app development
- [ ] Integration with HR systems

---

**Built with ❤️ for modern organizational management**
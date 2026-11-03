# WallCanva: Product Requirements
Smart Wall Paint Visualizer
Detailed guide and project requirements for the Smart Wall Paint Visualizer analysis.

Context:
Smart Wall Paint Visualizer is a web-based application that helps users visualize how different wall paint colours and designs will look in their real rooms. Users can upload a photo of their room, select specific wall areas, and apply virtual paint colours or designs to preview the final appearance before actual painting.

The platform is designed as a real-life interior visualization solution and demonstrates full-stack development using the MEAN stack.

Choosing the right wall paint colour is a critical decision in home interiors. Customers often rely on imagination, sample cards, or showroom displays, which do not accurately represent how colours appear in their own rooms due to lighting and space differences. A digital visualizer bridges this gap by offering a realistic preview.

A MEAN Stack based Virtual Room Paint & Design Preview Application.

Unified Mentor (Collaborating Organizations)
Behr Paint Visualizer (Reference)
Problem Statement
Customers face difficulty in selecting suitable wall paint colours and designs because:

• They cannot visualize the final painted look accurately
• Shade cards do not reflect real room lighting
• Wrong paint choices lead to dissatisfaction and repainting costs
• There is no easy, user-friendly virtual preview solution for common users
Primary Objectives
• Enable users to preview wall paint colours on their actual room photos
• Reduce incorrect paint selection and repainting expenses
• Improve customer confidence in interior design decisions
• Provide a realistic and interactive visualization experience
Secondary Objectives
• Support interior designers and painters during consultations
• Assist paint retailers in customer decision-making
• Encourage digital adoption in home improvement planning
• Demonstrate practical MEAN stack implementation
Scope of the Product
In Scope
• Web-based room image upload
• Manual wall area selection
• Virtual paint colour application
• Before and after preview
• Save and download painted images
• User and admin roles
Out of Scope (Phase 1)
• Automatic AI-based wall detection
• AR/VR live camera preview
• Mobile application
• Direct paint purchase and payment
Functional Requirements
1. User Features
• User registration and login
• Upload room images (JPG/PNG)
• Select wall areas manually using brush or polygon tools
• Apply different paint colours and basic designs
• Adjust opacity for realistic effect
• Preview before and after results
• Save and download final designs
2. Design & Visualization Management
• Colour palette management
• Support for solid colours and dual-tone walls
• Editable wall selection
• Multiple design trials per image
3. Admin Features
• Manage paint colours and shade details
• Add, update, or remove available designs
• View user activity and saved designs
• Maintain system configurations
Non-Functional Requirements
• Simple and intuitive UI
• Responsive design for desktop and tablet
• Fast image rendering and processing
• Secure handling of user data
• High system availability
Technology MEAN Stack
Frontend
• Angular 15+
• HTML5 Canvas / SVG
• CSS3 / SCSS
• JavaScript / TypeScript
Backend
• Node.js
• Express.js
• RESTful APIs
• JWT Authentication
Database
• MongoDB (User data, designs, colour palettes)
Deployment
• AWS / Vercel / Netlify
User Flow (High-Level)
• User registers or logs in
• Uploads room image
• Selects wall area
• Applies paint colour or design
• Previews changes
• Saves or downloads final image
Data Requirements
Data storage will be handled in MongoDB collections (e.g., Users, Projects, Colors, Patterns). Images can be stored with metadata (URLs) either in the database or a dedicated media store.

Sample Room/Project Data
• Project ID, User ID (owner)
• Original photo file (stored URL or file reference)
• Wall selection coordinates/polygon (JSON)
• Applied color/design ID and settings (finish, brightness level)
• Date created/modified
Sample Paint Colour Data
• Color ID (unique)
• Name (e.g. "Ocean Breeze Blue")
• HEX/RGB code(s)
• Brand/Manufacturer
• Finish options (e.g., matte, glossy)
• Category tags (e.g., "Living Room", "Accent")
• Image swatch or background for display
Sample Pattern/Wallpaper Data
• Pattern ID
• Name and description
• Category/style (e.g., "Floral", "Geometric")
• Image file (texture or sample)
• Dimensions or scaling info
Sample User Data
• User ID, Name, Email, Password Hash
• Role (User, Admin)
• Account creation date
• Saved project references
• favourite colours / patterns list
Sample Admin Data
• Admin ID (same schema as user)
• Privileges/permissions
• System settings references
Key Performance Indicators (KPIs)
• Number of room images uploaded
• Number of designs saved
• Average user session duration
• User satisfaction feedback
Assumptions & Constraints
Assumptions
• Users upload clear room images
• Manual wall selection is acceptable in Phase 1
• Users have basic internet and browser access
Constraints
• Image processing performance depends on image size
• Limited design and texture options initially
• No AI automation in first version
Deliverables
• PRD Documentation: Complete Product Requirements Document detailing all features, flows, and requirements (this document)
• Web Application: Fully functional Angular/Node web app with all in-scope features
• Admin Dashboard: Admin interface for content and user management
• Database Schema: Defined MongoDB collections for users, projects, colors, etc.
• User Documentation: Guide for end users (e.g., a "How to Use" tutorial within the app)
• Developer Documentation: README, setup and deployment instructions, API documentation
• Deployed System: Live deployment on a cloud environment (with domain) for demonstration
• Analytics Setup: Dashboard showing real-time KPIs and usage data
Expected Impact
• Simplifies wall paint selection process
• Reduces customer dissatisfaction
• Saves time and cost for users
• Enhances digital decision-making in interior design
Future Enhancements
• AI-based automatic wall detection
• Advanced textures and 3D previews
• Lighting simulation (day/night modes)
• Integration with paint brands and retailers
Project Guidelines & Implementation Notes
• The room images uploaded by users must be original and owned by the user, ensuring no copyright or privacy violations
• The application should provide a realistic visual representation of paint colours and designs; however, users should be informed that final results may vary due to lighting, screen calibration, and wall texture
• Manual wall selection tools must be simple, accurate, and user-friendly to ensure correct paint application on selected areas
• All paint colours, shade codes, and designs displayed in the system should be clearly defined and consistently applied across previews
• The project must be implemented as a web-only application using the MEAN stack, following clean coding standards and modular architecture
• The system should include a minimum of 6–7 interconnected functional pages, such as Login, Image Upload, Wall Selection, Colour Preview, Saved Designs, and Admin Panel
• Image uploads and user data must be handled securely, ensuring proper validation and storage practices
• The application should function as a complete end-to-end system, where all modules (frontend, backend, database) are fully integrated
• Focus should be on real-life usability, allowing non-technical users to easily preview and compare wall paint options before finalizing their decision
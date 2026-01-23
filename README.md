# UCE Library Book Loan Management System

A comprehensive library management system developed for the Central University of Ecuador. It features real-time inventory management, role-based access control (Admin/Student), management reporting (PDF/CSV), and automated email notifications.


## Technologies Used

* **Core:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Global & Server State:** [Zustand](https://github.com/pmndrs/zustand) (Client State) + [TanStack Query](https://tanstack.com/query) (Server State)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Auth:** [Supabase](https://supabase.com/)
* **Reporting:** jsPDF + AutoTable
* **Notifications:** EmailJS
* **Icons:** Lucide React

## Installation Instructions

To run this project locally on your machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kachiliquingal/final-project-library-system.git
    ```

2.  **Enter the project directory:**
    ```bash
    cd final-project-library-system
    ```

3.  **Install dependencies:**
    It is crucial to install the packages inside the project folder.
    ```bash
    npm install
    ```
    
4.  **Environment Setup (Important)**
   
    Create a file named `.env.local` in the root directory of the project. You must add your specific Supabase and EmailJS credentials for the application to function correctly.
    ```bash
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
    VITE_EMAILJS_TEMPLATE_STUDENT=your_student_template_id
    VITE_EMAILJS_TEMPLATE_ADMIN=your_admin_template_id
    VITE_EMAILJS_PUBLIC_KEY=your_public_key
    ```

    
5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open in browser:**
    Go to `http://localhost:5173/`


    
   ---

   ## 🐳 Deployment with Docker 

The application is fully containerized and published on Docker Hub. This ensures the application runs consistently on any machine without complex setups.
### Prerequisites 

Before running the command, make sure you have **Docker Engine** or **Docker Desktop** installed and running on your machine.
* [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

  ---

    ### Option A: Run via Docker Hub (Recommended)
    This is the fastest way to run the application. You do **not** need to clone the repository or install Node.js.

    **1. Open your Terminal**
    
       Open Command Prompt (cmd), PowerShell, or Terminal.

    **2. Run the container**

    Copy and paste the following command. This will automatically download the latest version of the app and start the server.
    
    ```bash
    docker run -p 8080:80 kachiliquingal/uce-library-system:latest
    ```

    **3. Access the app:**
    
       Once the command is running, open your web browser and navigate to: `http://localhost:8080`


    ### Option B: Build Locally
       If you have cloned the repository and want to build the image from the source code yourself:
    
    **1. Build the image:**
    ```bash
    docker build -t uce-library-system .
    ```


    **2. Run the container:**
    ```bash
    docker run -p 8080:80 uce-library-system
    ```


## 📂 Project Structure

* **`src/store/`**
    * `authStore.js`: **(Zustand)** Handles global session state, authentication logic, and user persistence via `localStorage`.

* **`src/context/`**
    * `AuthContext.jsx`: **(Adapter Pattern)** Acts as a bridge/proxy to connect UI components with the Zustand Store, allowing for a decoupled architecture.

* **`src/hooks/`**
    * `useRealtime.js`: Custom hook for handling Supabase real-time subscriptions (live updates for inventory/loans).
    * `useDebounce.js`: Optimization hook to delay search query execution, reducing server load during typing.

* **`src/api/`**
    * `supabaseClient.js`: Supabase client configuration and initialization.
    * `emailService.js`: Encapsulated logic for sending automated email notifications via EmailJS.
    * `queryClient.js`: Global configuration for TanStack Query (Server State management).

* **`src/pages/`**
    * `admin/`: Administrative modules (Dashboard with metrics, Inventory CRUD, Loan Management).
    * `user/`: Student interface (Book Catalog, My Loans history).
    * `LoginPage.jsx`: Central authentication view.

* **`src/components/`**
    * `admin/` & `user/`: Role-specific Layouts, Headers, and Sidebars.
    * `ProtectedRoute.jsx`: Security component that implements Role-Based Access Control (RBAC).

* **`src/utils/`**
    * `reportGenerator.js`: Logic for generating PDF and CSV management reports.
    * `bookCoverHelper.js`: Utility to handle book cover assignments based on categories.
---

## Author

**Alejandro Chiliquinga**

* **GitHub:** [@kachiliquingal](https://github.com/kachiliquingal)

---
*Developed for the Web Programming Course - January 2026*

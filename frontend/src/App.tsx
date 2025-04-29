import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import { Suspense, lazy } from 'react';
import LoadingFallback from './components/ui/LoadingFallback'; 

const PublicRoutes = lazy(() => 
  import('./routes/PublicRoute').then(module => ({ 
    default: module.PublicRoutes 
  }))
);

const UserRoutes = lazy(() => 
  import('./routes/UserRoutes').then(module => ({ 
    default: module.UserRoutes 
  }))
);

function App() {
  return (
    <Router>
      <ToastContainer />
      <Toaster />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/*" element={<PublicRoutes />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
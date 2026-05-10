import { Link } from 'react-router-dom';

const UserNameLink = ({ userId, children, className = '' }) => {
  if (!userId) return <span className={className}>{children}</span>;
  return (
    <Link
      to={`/users/${userId}`}
      onClick={(e) => e.stopPropagation()}
      className={`hover:text-valorant-red transition-colors ${className}`}
    >
      {children}
    </Link>
  );
};

export default UserNameLink;

import React, { useState } from 'react';

const VegToggle = ({ onToggle }) => {
  const [isVeg, setIsVeg] = useState(false);

  const handleToggle = () => {
    setIsVeg(!isVeg);
    onToggle(!isVeg);
  };

  return (
    <button
      className={`veg-toggle ${isVeg ? 'veg' : 'nonveg'}`}
      onClick={handleToggle}
    >
      {isVeg ? 'Veg Only' : 'All Recipes'}
    </button>
  );
};

export default VegToggle;

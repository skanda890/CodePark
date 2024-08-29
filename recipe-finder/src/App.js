import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axios.get(
          `https://api.spoonacular.com/recipes/complexSearch?apiKey=68f96c72b638477eaa3a7084ddcb99e3&query=${query}&number=10`
        );
        const filteredRecipes = vegOnly
          ? response.data.results.filter((recipe) => recipe.vegetarian)
          : response.data.results;
        setRecipes(filteredRecipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    if (query) {
      fetchRecipes();
    }
  }, [query, vegOnly]);

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  const handleToggle = () => {
    setVegOnly(!vegOnly);
  };

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Recipe Finder</h1>
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Enter ingredients..."
          className="border rounded-l py-2 px-4 focus:outline-none"
          value={query}
          onChange={handleChange}
        />
        <button
          className={`toggle-button ${vegOnly ? 'veg' : 'nonveg'}`}
          onClick={handleToggle}
        >
          {vegOnly ? 'Veg Only' : 'All Recipes'}
        </button>
      </div>
      {/* Rest of your recipe display logic */}
    </div>
  );
};

export default App;

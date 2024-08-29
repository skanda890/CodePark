import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axios.get(
          `https://api.spoonacular.com/recipes/complexSearch?apiKey=68f96c72b638477eaa3a7084ddcb99e3&query=${query}&number=10`
        );
        setRecipes(response.data.results);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    if (query) {
      fetchRecipes();
    }
  }, [query]);

  const handleChange = (event) => {
    setQuery(event.target.value);
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
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r focus:outline-none">
          Search
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="border rounded p-4 shadow-md">
            <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover mb-4" />
            <h2 className="text-xl font-bold mb-2">{recipe.title}</h2>
            <p className="text-gray-700">{recipe.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

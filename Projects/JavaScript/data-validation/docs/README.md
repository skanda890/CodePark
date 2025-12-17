# Data Validation Feature

## Overview

Comprehensive data validation.

## Installation

```bash
npm install joi
```

## Usage

```javascript
const schema = joi.object({
  email: joi.string().email().required(),
  age: joi.number().min(18).max(100),
});
```

export const GET_MEAL_PLAN_QUERY = `
  query GetMealPlanForDay($date: NaiveDate!) {
    getCanteens {
      id
      name
      lines {
        id
        name
        meals(date: $date) {
          id
          name
          mealType
          images {
            url
            rank
          }
          ratings {
            averageRating
            ratingsCount
          }
          price {
            student
            employee
            pupil
            guest
          }
        }
      }
    }
  }
`;

export const GET_MEAL_DETAIL_QUERY = `
  query GetMeal($date: NaiveDate!, $mealId: UUID!, $lineId: UUID!) {
    getMeal(date: $date, mealId: $mealId, lineId: $lineId) {
      id
      name
      mealType
      allergens
      additives
      images {
        id
        url
        rank
      }
      ratings {
        averageRating
        ratingsCount
      }
      price {
        student
        employee
        pupil
        guest
      }
      statistics {
        lastServed
        nextServed
        frequency
        new
      }
      environmentInfo {
        averageRating
        co2Rating
        co2Value
        waterRating
        waterValue
        animalWelfareRating
        rainforestRating
        maxRating
      }
      nutritionData {
        energy
        protein
        carbohydrates
        sugar
        fat
        saturatedFat
        salt
      }
      sides {
        id
        name
        mealType
        allergens
        additives
        price {
          student
          employee
          pupil
          guest
        }
      }
    }
  }
`;

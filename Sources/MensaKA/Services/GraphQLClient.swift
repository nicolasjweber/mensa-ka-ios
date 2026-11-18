import Foundation

public enum GraphQLError: LocalizedError, Sendable {
    case invalidURL
    case httpError(Int)
    case serverError(String)
    case invalidResponse

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .httpError(let code):
            return "Server request failed (\(code))"
        case .serverError(let message):
            return message
        case .invalidResponse:
            return "Unexpected API response format"
        }
    }
}

private struct GraphQLRequestPayload<V: Encodable>: Encodable {
    let query: String
    let variables: V
    let operationName: String
}

private struct GraphQLResponsePayload<T: Decodable>: Decodable {
    let data: T?
    let errors: [GraphQLErrorItem]?
}

private struct GraphQLErrorItem: Decodable {
    let message: String?
}

private struct MealPlanData: Decodable {
    let getCanteens: [Canteen]?
}

private struct MealPlanVariables: Encodable {
    let date: String
}

private struct MealDetailData: Decodable {
    let getMeal: Meal?
}

private struct MealDetailVariables: Encodable {
    let date: String
    let mealId: String
    let lineId: String
}

public struct GraphQLClient: Sendable {
    public static let defaultAPIURL = "https://api.mensa-ka.de/"

    private static let mealPlanQuery = """
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
    """

    private static let mealDetailQuery = """
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
    """

    public static func resolveAPIURL(_ customURL: String?) -> String {
        let trimmed = customURL?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? defaultAPIURL : trimmed
    }

    public static func execute<T: Decodable, V: Encodable>(
        query: String,
        variables: V,
        operationName: String,
        forceRefresh: Bool = false,
        customAPIURL: String? = nil,
        authHeader: String? = nil
    ) async throws -> T {
        let baseString = resolveAPIURL(customAPIURL)
        let endpointString: String
        if forceRefresh {
            let separator = baseString.contains("?") ? "&" : "?"
            endpointString = "\(baseString)\(separator)refresh=1"
        } else {
            endpointString = baseString
        }

        guard let url = URL(string: endpointString) else {
            throw GraphQLError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if forceRefresh {
            request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
            request.setValue("no-cache", forHTTPHeaderField: "Pragma")
            request.setValue("true", forHTTPHeaderField: "X-Refresh")
        }

        if let authHeader, !authHeader.isEmpty {
            request.setValue(authHeader, forHTTPHeaderField: "Authorization")
        }

        let payload = GraphQLRequestPayload(
            query: query,
            variables: variables,
            operationName: operationName
        )
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw GraphQLError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            throw GraphQLError.httpError(http.statusCode)
        }

        let decoded = try JSONDecoder().decode(GraphQLResponsePayload<T>.self, from: data)
        if let firstError = decoded.errors?.first?.message, !firstError.isEmpty {
            throw GraphQLError.serverError(firstError)
        }
        guard let result = decoded.data else {
            throw GraphQLError.invalidResponse
        }
        return result
    }

    public static func fetchMealPlan(
        date: String,
        forceRefresh: Bool = false,
        customAPIURL: String? = nil,
        authHeader: String? = nil
    ) async throws -> [Canteen] {
        let data: MealPlanData = try await execute(
            query: mealPlanQuery,
            variables: MealPlanVariables(date: date),
            operationName: "GetMealPlanForDay",
            forceRefresh: forceRefresh,
            customAPIURL: customAPIURL,
            authHeader: authHeader
        )
        guard let canteens = data.getCanteens else {
            throw GraphQLError.invalidResponse
        }
        return canteens
    }

    public static func fetchMealDetail(
        date: String,
        mealId: String,
        lineId: String,
        customAPIURL: String? = nil,
        authHeader: String? = nil
    ) async throws -> Meal? {
        let data: MealDetailData = try await execute(
            query: mealDetailQuery,
            variables: MealDetailVariables(date: date, mealId: mealId, lineId: lineId),
            operationName: "GetMeal",
            customAPIURL: customAPIURL,
            authHeader: authHeader
        )
        return data.getMeal
    }
}

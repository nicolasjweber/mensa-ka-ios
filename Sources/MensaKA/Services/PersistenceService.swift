import Foundation
import Security

public struct CachedMealPlanEntry: Codable, Sendable {
    public let canteens: [Canteen]
    public let updatedAt: Date
}

public enum PersistenceService {
    private static let preferencesKey = "mensa-ka:preferences:v1"
    private static let favoritesKey = "mensa-ka:favorites:v1"
    private static let keychainService = "de.weber.mensaka"
    private static let clientIDAccount = "mensa_ka_client_id"
    private static let authHeaderAccount = "mensa_ka_custom_auth_header"

    // MARK: - Preferences

    public static func loadPreferences() -> UserPreferences {
        guard let data = UserDefaults.standard.data(forKey: preferencesKey),
              var decoded = try? JSONDecoder().decode(UserPreferences.self, from: data)
        else {
            return .defaults
        }
        decoded.normalizeDetailSections()
        if let custom = decoded.customApiUrl?.trimmingCharacters(in: .whitespacesAndNewlines) {
            decoded.customApiUrl = custom.isEmpty ? nil : custom
        }
        return decoded
    }

    public static func savePreferences(_ prefs: UserPreferences) {
        guard let data = try? JSONEncoder().encode(prefs) else { return }
        UserDefaults.standard.set(data, forKey: preferencesKey)
    }

    // MARK: - Favorites

    public static func loadFavorites() -> [String: FavoriteSnapshot] {
        guard let data = UserDefaults.standard.data(forKey: favoritesKey),
              let decoded = try? JSONDecoder().decode([String: FavoriteSnapshot].self, from: data)
        else {
            return [:]
        }
        return decoded
    }

    public static func saveFavorites(_ favorites: [String: FavoriteSnapshot]) {
        guard let data = try? JSONEncoder().encode(favorites) else { return }
        UserDefaults.standard.set(data, forKey: favoritesKey)
    }

    // MARK: - Offline Meal Plan Disk Cache

    private static var cacheDirectory: URL? {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?
            .appendingPathComponent("MensaKA", isDirectory: true)
    }

    private static var mealPlanCacheURL: URL? {
        cacheDirectory?.appendingPathComponent("mealPlanCache.json")
    }

    public static func loadMealPlanCache() -> [String: CachedMealPlanEntry] {
        guard let url = mealPlanCacheURL,
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([String: CachedMealPlanEntry].self, from: data)
        else {
            return [:]
        }
        let cutoff = Date().addingTimeInterval(-7 * 24 * 60 * 60)
        return decoded.filter { $0.value.updatedAt >= cutoff }
    }

    public static func saveMealPlanCache(_ cache: [String: CachedMealPlanEntry]) {
        guard let dir = cacheDirectory, let url = mealPlanCacheURL else { return }
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        guard let data = try? JSONEncoder().encode(cache) else { return }
        try? data.write(to: url, options: .atomic)
    }

    public static func clearMealPlanCache() {
        guard let url = mealPlanCacheURL else { return }
        try? FileManager.default.removeItem(at: url)
    }

    // MARK: - Keychain

    public static func getOrCreateClientID() -> String {
        if let existing = readKeychain(account: clientIDAccount) {
            return existing
        }
        let generated = UUID().uuidString.lowercased()
        writeKeychain(account: clientIDAccount, value: generated)
        return generated
    }

    public static func getCustomAuthHeader() -> String? {
        readKeychain(account: authHeaderAccount)
    }

    private static func readKeychain(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    private static func writeKeychain(account: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
        ]
        let attributes: [String: Any] = [kSecValueData as String: data]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var newItem = query
            newItem[kSecValueData as String] = data
            SecItemAdd(newItem as CFDictionary, nil)
        }
    }
}

import CryptoKit
import Foundation
#if canImport(UIKit)
import UIKit
#endif

actor ImageDiskStore {
    static let shared = ImageDiskStore()

    private var inFlight: [String: Task<Data?, Never>] = [:]

    private var imagesDirectory: URL? {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?
            .appendingPathComponent("MensaKA/images", isDirectory: true)
    }

    private func diskFileURL(for urlString: String) -> URL? {
        guard let dir = imagesDirectory else { return nil }
        let digest = SHA256.hash(data: Data(urlString.utf8))
        let hex = digest.map { String(format: "%02x", $0) }.joined()
        return dir.appendingPathComponent(hex)
    }

    func fetchData(for urlString: String) async -> Data? {
        if let fileURL = diskFileURL(for: urlString),
           let diskData = try? Data(contentsOf: fileURL) {
            return diskData
        }

        if let existingTask = inFlight[urlString] {
            return await existingTask.value
        }

        let task = Task<Data?, Never> { [urlString] in
            guard let url = URL(string: urlString) else { return nil }
            do {
                let (data, response) = try await URLSession.shared.data(from: url)
                guard let http = response as? HTTPURLResponse,
                      (200...299).contains(http.statusCode),
                      !data.isEmpty
                else {
                    return nil
                }
                if let dir = imagesDirectory, let fileURL = diskFileURL(for: urlString) {
                    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                    try? data.write(to: fileURL, options: .atomic)
                }
                return data
            } catch {
                return nil
            }
        }

        inFlight[urlString] = task
        let result = await task.value
        inFlight[urlString] = nil
        return result
    }

    func clearDisk() {
        if let dir = imagesDirectory {
            try? FileManager.default.removeItem(at: dir)
        }
    }
}

@MainActor
public final class ImageDiskCache {
    public static let shared = ImageDiskCache()

    private let memoryCache = NSCache<NSString, UIImage>()

    private init() {
        memoryCache.countLimit = 200
    }

    public func image(for urlString: String) async -> UIImage? {
        let key = urlString as NSString
        if let cached = memoryCache.object(forKey: key) {
            return cached
        }
        guard let data = await ImageDiskStore.shared.fetchData(for: urlString),
              let image = UIImage(data: data)
        else {
            return nil
        }
        memoryCache.setObject(image, forKey: key)
        return image
    }

    public func clearAll() async {
        memoryCache.removeAllObjects()
        await ImageDiskStore.shared.clearDisk()
    }
}

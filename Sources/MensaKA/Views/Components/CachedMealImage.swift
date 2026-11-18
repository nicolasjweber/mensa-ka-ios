import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct CachedMealImage: View {
    public let urlString: String
    public var contentMode: ContentMode = .fill
    public var showLoadingSpinner: Bool = false

    @State private var loadedImage: UIImage?
    @State private var isLoading: Bool = true

    public init(urlString: String, contentMode: ContentMode = .fill, showLoadingSpinner: Bool = false) {
        self.urlString = urlString
        self.contentMode = contentMode
        self.showLoadingSpinner = showLoadingSpinner
    }

    public var body: some View {
        ZStack {
            if let loadedImage {
                Image(uiImage: loadedImage)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .transition(.opacity.animation(.easeOut(duration: 0.18)))
            } else {
                Color.clear
                if showLoadingSpinner && isLoading {
                    ProgressView()
                        .tint(.white)
                        .controlSize(.large)
                }
            }
        }
        .task(id: urlString) {
            isLoading = true
            let img = await ImageDiskCache.shared.image(for: urlString)
            if !Task.isCancelled {
                loadedImage = img
                isLoading = false
            }
        }
    }
}

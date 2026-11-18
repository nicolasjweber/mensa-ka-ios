import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct LightboxView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.lightboxNamespace) private var lightboxNamespace

    public let payload: LightboxPayload

    @State private var activeIndex: Int
    @State private var chromeVisible: Bool = true
    @State private var backdropAlpha: Double = 1.0
    @State private var isZoomed: Bool = false

    public init(payload: LightboxPayload) {
        self.payload = payload
        let safeIdx = min(max(0, payload.initialIndex), max(0, payload.urls.count - 1))
        self._activeIndex = State(initialValue: safeIdx)
    }

    public var body: some View {
        let s = store.strings
        let urls = payload.urls
        let activeURLString = activeIndex < urls.count ? urls[activeIndex] : (urls.first ?? "")
        let cleanLine = MealUtils.cleanLineName(payload.lineName)

        NavigationStack {
            ZStack {
                Color.black
                    .opacity(backdropAlpha)
                    .ignoresSafeArea()

                TabView(selection: $activeIndex) {
                    ForEach(Array(urls.enumerated()), id: \.offset) { idx, urlString in
                        ZoomablePhotoSlide(
                            urlString: urlString,
                            onSingleTap: {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    chromeVisible.toggle()
                                }
                            },
                            onZoomChanged: { zoomed in
                                isZoomed = zoomed
                            },
                            onBackdropDrag: { alpha in
                                backdropAlpha = alpha
                            },
                            onDismiss: {
                                dismiss()
                            }
                        )
                        .tag(idx)
                        .ignoresSafeArea()
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .scrollDisabled(isZoomed)
                .ignoresSafeArea()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(alignment: .bottom) {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    VStack(alignment: .leading, spacing: 4) {
                        if !cleanLine.isEmpty {
                            HStack(spacing: 5) {
                                Image(systemName: "fork.knife")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(ThemePalette.brand)
                                Text(cleanLine)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color.white.opacity(0.85))
                                    .lineLimit(1)
                            }
                        }

                        Text(payload.title)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Spacing.lg)

                    if urls.count > 1 {
                        ViewThatFits(in: .horizontal) {
                            thumbnailStripRow(urls: urls)
                                .frame(maxWidth: .infinity, alignment: .center)

                            ScrollViewReader { proxy in
                                ScrollView(.horizontal, showsIndicators: false) {
                                    thumbnailStripRow(urls: urls)
                                }
                                .onChange(of: activeIndex) { _, newIndex in
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        proxy.scrollTo(newIndex, anchor: .center)
                                    }
                                }
                                .onAppear {
                                    proxy.scrollTo(activeIndex, anchor: .center)
                                }
                            }
                        }
                        .background(
                            RoundedRectangle(cornerRadius: Radii.lg, style: .continuous)
                                .fill(.ultraThinMaterial)
                        )
                        .padding(.horizontal, Spacing.lg)
                    }
                }
                .padding(.top, 36)
                .padding(.bottom, Spacing.md)
                .background(
                    LinearGradient(
                        colors: [.clear, Color.black.opacity(0.75)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .ignoresSafeArea(edges: .bottom)
                )
                .opacity(chromeVisible ? backdropAlpha : 0)
                .allowsHitTesting(chromeVisible)
            }
            .toolbar(chromeVisible ? .visible : .hidden, for: .navigationBar)
            .toolbarBackgroundVisibility(.hidden, for: .navigationBar)
            .toolbar {
                if urls.count > 1 {
                    ToolbarItem(placement: .topBarLeading) {
                        Text("\(activeIndex + 1) / \(urls.count)")
                            .font(.subheadline.weight(.semibold))
                            .monospacedDigit()
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                    }
                }

                ToolbarItemGroup(placement: .topBarTrailing) {
                    if let shareURL = URL(string: activeURLString) {
                        ShareLink(item: shareURL, subject: Text(payload.title))
                            .accessibilityLabel(s.lightboxShare)
                    }

                    Button(role: .close) {
                        dismiss()
                    }
                    .accessibilityLabel(s.lightboxClose)
                }
            }
        }
        .preferredColorScheme(.dark)
        .statusBarHidden(!chromeVisible)
        .optionalZoomTransition(sourceID: payload.transitionID, in: lightboxNamespace)
        .onChange(of: activeIndex) { _, _ in
            isZoomed = false
        }
    }

    private func thumbnailStripRow(urls: [String]) -> some View {
        HStack(spacing: Spacing.sm) {
            ForEach(Array(urls.enumerated()), id: \.offset) { idx, thumbURL in
                let active = idx == activeIndex
                Button {
                    Haptics.selection()
                    withAnimation(.easeInOut(duration: 0.2)) {
                        activeIndex = idx
                        isZoomed = false
                    }
                } label: {
                    CachedMealImage(urlString: thumbURL, contentMode: .fill)
                        .frame(width: 52, height: 52)
                        .clipped()
                        .clipShape(RoundedRectangle(cornerRadius: Radii.sm, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radii.sm, style: .continuous)
                                .stroke(
                                    active ? ThemePalette.brand : Color.white.opacity(0.25),
                                    lineWidth: active ? 2.5 : 1
                                )
                        )
                        .opacity(active ? 1.0 : 0.65)
                }
                .buttonStyle(.plain)
                .id(idx)
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
    }
}

private struct ZoomablePhotoSlide: View {
    let urlString: String
    let onSingleTap: () -> Void
    let onZoomChanged: (Bool) -> Void
    let onBackdropDrag: (Double) -> Void
    let onDismiss: () -> Void

    @State private var loadedImage: UIImage?
    @State private var isLoading: Bool = true

    var body: some View {
        ZStack {
            if let loadedImage {
                NativeZoomableImageView(
                    image: loadedImage,
                    onSingleTap: onSingleTap,
                    onZoomChanged: onZoomChanged,
                    onBackdropDrag: onBackdropDrag,
                    onDismiss: onDismiss
                )
            } else {
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        onSingleTap()
                    }
                if isLoading {
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

private struct NativeZoomableImageView: UIViewRepresentable {
    let image: UIImage
    let onSingleTap: () -> Void
    let onZoomChanged: (Bool) -> Void
    let onBackdropDrag: (Double) -> Void
    let onDismiss: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(
            onSingleTap: onSingleTap,
            onZoomChanged: onZoomChanged,
            onBackdropDrag: onBackdropDrag,
            onDismiss: onDismiss
        )
    }

    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = ZoomScrollView()
        scrollView.backgroundColor = .clear
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 4.0
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.bouncesZoom = true
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.delegate = context.coordinator

        let imageView = UIImageView(image: image)
        imageView.contentMode = .scaleAspectFit
        imageView.isUserInteractionEnabled = true
        scrollView.addSubview(imageView)

        context.coordinator.scrollView = scrollView
        context.coordinator.imageView = imageView
        scrollView.onLayout = { [weak coordinator = context.coordinator] in
            coordinator?.layoutImageIfNeeded()
        }

        let doubleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleDoubleTap(_:)))
        doubleTap.numberOfTapsRequired = 2
        scrollView.addGestureRecognizer(doubleTap)

        let singleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleSingleTap))
        singleTap.numberOfTapsRequired = 1
        singleTap.require(toFail: doubleTap)
        scrollView.addGestureRecognizer(singleTap)

        let dismissPan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleVerticalPan(_:)))
        dismissPan.delegate = context.coordinator
        scrollView.addGestureRecognizer(dismissPan)

        return scrollView
    }

    func updateUIView(_ scrollView: UIScrollView, context: Context) {
        if context.coordinator.imageView?.image !== image {
            context.coordinator.imageView?.image = image
            scrollView.setZoomScale(1.0, animated: false)
        }
        context.coordinator.layoutImageIfNeeded()
    }

    @MainActor
    final class Coordinator: NSObject, UIScrollViewDelegate, UIGestureRecognizerDelegate {
        weak var scrollView: UIScrollView?
        weak var imageView: UIImageView?
        private var lastBoundsSize: CGSize = .zero

        let onSingleTap: () -> Void
        let onZoomChanged: (Bool) -> Void
        let onBackdropDrag: (Double) -> Void
        let onDismiss: () -> Void

        init(
            onSingleTap: @escaping () -> Void,
            onZoomChanged: @escaping (Bool) -> Void,
            onBackdropDrag: @escaping (Double) -> Void,
            onDismiss: @escaping () -> Void
        ) {
            self.onSingleTap = onSingleTap
            self.onZoomChanged = onZoomChanged
            self.onBackdropDrag = onBackdropDrag
            self.onDismiss = onDismiss
        }

        func layoutImageIfNeeded() {
            guard let scrollView, let imageView, let image = imageView.image else { return }
            let boundsSize = scrollView.bounds.size
            guard boundsSize.width > 0, boundsSize.height > 0, boundsSize != lastBoundsSize else { return }
            lastBoundsSize = boundsSize

            scrollView.setZoomScale(1.0, animated: false)
            let imageSize = image.size
            guard imageSize.width > 0, imageSize.height > 0 else { return }
            let scale = min(boundsSize.width / imageSize.width, boundsSize.height / imageSize.height)
            let fittedSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
            imageView.frame = CGRect(origin: .zero, size: fittedSize)
            scrollView.contentSize = fittedSize
            centerImage()
        }

        private func centerImage() {
            guard let scrollView, let imageView else { return }
            let boundsSize = scrollView.bounds.size
            var frameToCenter = imageView.frame
            frameToCenter.origin.x = frameToCenter.width < boundsSize.width
                ? (boundsSize.width - frameToCenter.width) / 2
                : 0
            frameToCenter.origin.y = frameToCenter.height < boundsSize.height
                ? (boundsSize.height - frameToCenter.height) / 2
                : 0
            imageView.frame = frameToCenter
        }

        func viewForZooming(in scrollView: UIScrollView) -> UIView? {
            imageView
        }

        func scrollViewDidZoom(_ scrollView: UIScrollView) {
            centerImage()
            onZoomChanged(scrollView.zoomScale > 1.02)
        }

        @objc func handleSingleTap() {
            onSingleTap()
        }

        @objc func handleDoubleTap(_ gesture: UITapGestureRecognizer) {
            guard let scrollView, let imageView else { return }
            if scrollView.zoomScale > 1.02 {
                scrollView.setZoomScale(1.0, animated: true)
            } else {
                let point = gesture.location(in: imageView)
                let targetScale: CGFloat = 2.5
                let width = scrollView.bounds.width / targetScale
                let height = scrollView.bounds.height / targetScale
                let zoomRect = CGRect(
                    x: point.x - width / 2,
                    y: point.y - height / 2,
                    width: width,
                    height: height
                )
                scrollView.zoom(to: zoomRect, animated: true)
            }
        }

        func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
            guard let pan = gestureRecognizer as? UIPanGestureRecognizer,
                  let scrollView
            else { return true }
            guard scrollView.zoomScale <= 1.02 else { return false }
            let velocity = pan.velocity(in: scrollView)
            return velocity.y > 0 && abs(velocity.y) > abs(velocity.x) * 1.3
        }

        @objc func handleVerticalPan(_ pan: UIPanGestureRecognizer) {
            guard let scrollView, let imageView else { return }
            let dy = max(0, pan.translation(in: scrollView).y)
            let vy = pan.velocity(in: scrollView).y

            switch pan.state {
            case .changed:
                let dismissScale = max(0.82, 1.0 - (dy / 320.0) * 0.18)
                imageView.transform = CGAffineTransform(translationX: 0, y: dy).scaledBy(x: dismissScale, y: dismissScale)
                onBackdropDrag(max(0.2, min(1.0, 1.0 - Double(dy) / 320.0)))
            case .ended, .cancelled:
                let shouldDismiss = dy > 110 || (dy > 35 && vy > 650)
                if shouldDismiss {
                    UIView.animate(withDuration: 0.18) {
                        imageView.transform = CGAffineTransform(translationX: 0, y: scrollView.bounds.height * 0.45).scaledBy(x: 0.8, y: 0.8)
                    }
                    onBackdropDrag(0)
                    onDismiss()
                } else {
                    UIView.animate(withDuration: 0.28, delay: 0, usingSpringWithDamping: 0.85, initialSpringVelocity: 0) {
                        imageView.transform = .identity
                    }
                    onBackdropDrag(1.0)
                }
            default:
                break
            }
        }
    }
}

private final class ZoomScrollView: UIScrollView {
    var onLayout: (() -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        onLayout?()
    }
}

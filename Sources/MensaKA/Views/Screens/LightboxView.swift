import SwiftUI

/// Fullscreen swipeable photo viewer displaying a meal's photos along with
/// the dish name and the canteen line where it is offered.
public struct LightboxView: View {
    public let payload: LightboxPayload

    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var activeIndex: Int
    @State private var chromeVisible = true

    public init(payload: LightboxPayload) {
        self.payload = payload
        let maxIndex = max(0, payload.urls.count - 1)
        let clamped = min(max(0, payload.initialIndex), maxIndex)
        _activeIndex = State(initialValue: clamped)
    }

    private var cleanLine: String {
        MealUtils.cleanLineName(payload.lineName)
    }

    private var currentShareURL: URL? {
        guard payload.urls.indices.contains(activeIndex) else { return nil }
        return URL(string: payload.urls[activeIndex])
    }

    public var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                    .opacity(chromeVisible ? 1 : 0)
                    .allowsHitTesting(chromeVisible)

                photoPager
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                bottomCaption
                    .opacity(chromeVisible ? 1 : 0)
                    .allowsHitTesting(chromeVisible)
            }
        }
        .preferredColorScheme(.dark)
        .statusBarHidden(!chromeVisible)
        .onChange(of: activeIndex) { _, _ in
            Haptics.selection()
        }
    }

    @ViewBuilder
    private var topBar: some View {
        HStack(spacing: Spacing.sm) {
            if payload.urls.count > 1 {
                Text("\(activeIndex + 1) / \(payload.urls.count)")
                    .font(.subheadline.weight(.semibold))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, 7)
                    .background(.white.opacity(0.14), in: Capsule())
            }

            Spacer()

            GlassEffectContainer(spacing: Spacing.sm) {
                HStack(spacing: Spacing.sm) {
                    if let shareURL = currentShareURL {
                        ShareLink(item: shareURL, subject: Text(payload.title)) {
                            Label(store.strings.lightboxShare, systemImage: "square.and.arrow.up")
                                .labelStyle(.iconOnly)
                                .frame(width: 24, height: 24)
                        }
                        .buttonStyle(.glass)
                        .accessibilityLabel(store.strings.lightboxShare)
                    }

                    Button(role: .close) {
                        dismiss()
                    }
                    .buttonStyle(.glass)
                    .accessibilityLabel(store.strings.lightboxClose)
                }
            }
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.top, Spacing.sm)
        .padding(.bottom, Spacing.sm)
    }

    @ViewBuilder
    private var photoPager: some View {
        TabView(selection: $activeIndex) {
            ForEach(Array(payload.urls.enumerated()), id: \.offset) { index, url in
                LightboxPhotoSlide(
                    urlString: url,
                    isActive: activeIndex == index,
                    onTap: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            chromeVisible.toggle()
                        }
                    }
                )
                .tag(index)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: payload.urls.count > 1 ? .automatic : .never))
    }

    @ViewBuilder
    private var bottomCaption: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            if !cleanLine.isEmpty {
                Label {
                    Text(cleanLine)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ThemePalette.brand)
                        .lineLimit(1)
                } icon: {
                    Image(systemName: "fork.knife")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ThemePalette.brand)
                }
            }

            Text(payload.title)
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, Spacing.lg)
        .padding(.vertical, Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: Radii.md, style: .continuous)
                .fill(.white.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: Radii.md, style: .continuous)
                        .strokeBorder(.white.opacity(0.14), lineWidth: 1)
                )
        )
        .padding(.horizontal, Spacing.lg)
        .padding(.top, Spacing.sm)
        .padding(.bottom, Spacing.md)
    }
}

private struct LightboxPhotoSlide: View {
    let urlString: String
    let isActive: Bool
    let onTap: () -> Void

    @State private var committedScale: CGFloat = 1.0
    @GestureState private var gestureScale: CGFloat = 1.0

    private var effectiveScale: CGFloat {
        min(max(committedScale * gestureScale, 1.0), 4.0)
    }

    var body: some View {
        GeometryReader { geo in
            CachedMealImage(
                urlString: urlString,
                contentMode: .fit,
                showLoadingSpinner: true
            )
            .frame(width: geo.size.width, height: geo.size.height)
            .scaleEffect(effectiveScale)
            .clipped()
            .contentShape(Rectangle())
            .gesture(
                MagnifyGesture()
                    .updating($gestureScale) { value, state, _ in
                        state = value.magnification
                    }
                    .onEnded { value in
                        let updated = committedScale * value.magnification
                        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
                            committedScale = min(max(updated, 1.0), 4.0)
                        }
                    }
            )
            .onTapGesture(count: 2) {
                withAnimation(.spring(response: 0.28, dampingFraction: 0.82)) {
                    committedScale = committedScale > 1.1 ? 1.0 : 2.5
                }
            }
            .onTapGesture(count: 1) {
                onTap()
            }
        }
        .onChange(of: isActive) { _, active in
            if !active && committedScale != 1.0 {
                committedScale = 1.0
            }
        }
    }
}

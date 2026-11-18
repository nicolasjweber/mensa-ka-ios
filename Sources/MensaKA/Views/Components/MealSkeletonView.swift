import SwiftUI

public struct MealSkeletonView: View {
    @State private var pulse: Bool = false

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            ForEach(0..<2, id: \.self) { _ in
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    skeletonBlock(width: 170, height: 20, radius: Radii.sm)
                    skeletonMealRow()
                    skeletonMealRow()
                }
            }
        }
        .padding(.top, Spacing.sm)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }

    private func skeletonMealRow() -> some View {
        HStack(spacing: Spacing.md) {
            skeletonBlock(width: 92, height: 92, radius: Radii.sm)

            VStack(alignment: .leading, spacing: Spacing.sm) {
                skeletonBlock(width: nil, height: 18, radius: Radii.sm)
                skeletonBlock(width: 160, height: 14, radius: Radii.sm)
                Spacer(minLength: 0)
                HStack {
                    skeletonBlock(width: 68, height: 22, radius: 11)
                    Spacer()
                    skeletonBlock(width: 54, height: 22, radius: Radii.sm)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 92)
        }
        .padding(Spacing.md)
        .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.md)
                .stroke(ThemePalette.border, lineWidth: 1)
        )
    }

    private func skeletonBlock(width: CGFloat?, height: CGFloat, radius: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: radius)
            .fill(pulse ? ThemePalette.skeletonEnd : ThemePalette.skeletonStart)
            .frame(maxWidth: width == nil ? .infinity : width, minHeight: height, maxHeight: height)
    }
}

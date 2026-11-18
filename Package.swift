// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MensaKA",
    platforms: [
        .iOS("26.0"),
    ],
    products: [
        .library(
            name: "MensaKA",
            targets: ["MensaKA"]
        ),
    ],
    targets: [
        .target(
            name: "MensaKA",
            path: "Sources/MensaKA"
        ),
    ]
)

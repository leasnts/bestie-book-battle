//
//  bbbWidget.swift
//  bbbWidget
//
//  Widget Bestie Book Battle — Redesign Light
//  Jauge de progression (arc ouvert) + top 2 du classement
//

import WidgetKit
import SwiftUI

// ─────────────────────────────────────────────────────────────
// MARK: - Modèles de données
// ─────────────────────────────────────────────────────────────

struct WidgetData: Codable {
    var totalPages: Int
    var averageProgress: Double
    var participant1Name: String
    var participant1Page: Int
    var participant2Name: String?
    var participant2Page: Int?
    var lastUpdated: String
}

struct OldWidgetData: Codable {
    var bookTitle: String
    var bookAuthor: String
    var myCurrentPage: Int
    var myTotalPages: Int
    var myStreak: Int
    var friendName: String?
    var friendCurrentPage: Int?
    var lastUpdated: String
}

// ─────────────────────────────────────────────────────────────
// MARK: - Entry
// ─────────────────────────────────────────────────────────────

struct BookEntry: TimelineEntry {
    let date: Date
    let totalPages: Int
    let averageProgress: Double
    let participant1Name: String
    let participant1Page: Int
    let participant2Name: String?
    let participant2Page: Int?

    static var placeholder: BookEntry {
        BookEntry(
            date: Date(),
            totalPages: 350,
            averageProgress: 0.65,
            participant1Name: "Zoé",
            participant1Page: 230,
            participant2Name: "Léa",
            participant2Page: 201
        )
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Provider
// ─────────────────────────────────────────────────────────────

struct Provider: TimelineProvider {

    func placeholder(in context: Context) -> BookEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (BookEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BookEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> BookEntry {
        let userDefaults = UserDefaults(suiteName: "group.com.leasantos.bestiebookbattle")

        guard let jsonString = userDefaults?.string(forKey: "widgetData"),
              let data = jsonString.data(using: .utf8) else {
            return emptyEntry()
        }

        if let w = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return BookEntry(
                date: Date(),
                totalPages: w.totalPages,
                averageProgress: w.averageProgress,
                participant1Name: w.participant1Name,
                participant1Page: w.participant1Page,
                participant2Name: w.participant2Name,
                participant2Page: w.participant2Page
            )
        }

        if let old = try? JSONDecoder().decode(OldWidgetData.self, from: data) {
            let progress = old.myTotalPages > 0
                ? Double(old.myCurrentPage) / Double(old.myTotalPages) : 0
            return BookEntry(
                date: Date(),
                totalPages: old.myTotalPages,
                averageProgress: min(progress, 1.0),
                participant1Name: "Moi",
                participant1Page: old.myCurrentPage,
                participant2Name: old.friendName,
                participant2Page: old.friendCurrentPage
            )
        }

        return emptyEntry()
    }

    private func emptyEntry() -> BookEntry {
        BookEntry(
            date: Date(),
            totalPages: 1,
            averageProgress: 0,
            participant1Name: "Ouvre l'app !",
            participant1Page: 0,
            participant2Name: nil,
            participant2Page: nil
        )
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Vue principale
// ─────────────────────────────────────────────────────────────

struct bbbWidgetEntryView: View {
    var entry: BookEntry

    var body: some View {
        SmallWidgetView(entry: entry)
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Small Widget
//
// La jauge est un ARC OUVERT (pas un cercle fermé).
// Elle se remplit de gauche à droite, avec un gap en bas
// où la mascotte PopEyes dépasse du widget.
// ─────────────────────────────────────────────────────────────

struct SmallWidgetView: View {
    let entry: BookEntry

    var body: some View {
        GeometryReader { geo in
            let side = min(geo.size.width, geo.size.height)

            ZStack {
                // ── Jauge de progression (arc ouvert) ──
                DashedProgressGauge(progress: entry.averageProgress)
                    .frame(width: side * 0.88, height: side * 0.88)

                // ── Top 2 participants ──
                VStack(alignment: .leading, spacing: 6) {
                    // Leader (top 1) + couronne qui chevauche la photo
                    ZStack(alignment: .topLeading) {
                        ParticipantRow(
                            name: entry.participant1Name,
                            page: entry.participant1Page,
                            avatarColor: Color(hex: "C4876E")
                        )

                        if entry.participant1Page > 0 {
                            Image("Crown")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 24)
                                .offset(x: 1, y: -10)
                        }
                    }

                    // Second (top 2)
                    if let name = entry.participant2Name,
                       let page = entry.participant2Page {
                        ParticipantRow(
                            name: name,
                            page: page,
                            avatarColor: Color(hex: "8B7EC4")
                        )
                    }
                }
                .offset(y: -side * 0.06)

                // ── Mascotte PopEyes ──
                // Positionnée très bas pour déborder du widget.
                // iOS clippe automatiquement au bord arrondi.
                Image("PopEyes")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: side * 0.55)
                    .rotationEffect(.degrees(-25))
                    .offset(y: side * 0.43)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .background(Color.white)
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Jauge en arc ouvert (DashedProgressGauge)
//
// Contrairement à un cercle fermé, cette jauge est un ARC
// OUVERT en bas (~80° de gap). Elle se remplit de GAUCHE à
// DROITE, comme un compteur de vitesse.
//
// Maths :
// - Arc total = 280° (= 360° - 80° de gap)
// - En fraction de cercle : 280/360 = 0.778
// - Rotation de 130° pour que l'arc commence en bas-gauche
//   (position ~7h20 sur une horloge) et finisse en bas-droite
//   (~4h40), avec le gap centré en bas.
// - Le progress remplit proportionnellement cet arc.
// ─────────────────────────────────────────────────────────────

struct DashedProgressGauge: View {
    let progress: Double

    private let arcFraction: Double = 0.778
    private let startRotation: Double = 130

    var body: some View {
        ZStack {
            // Arc de fond (gris clair) — la totalité de la jauge
            Circle()
                .trim(from: 0, to: arcFraction)
                .stroke(
                    style: StrokeStyle(lineWidth: 5, dash: [5.5, 2.5])
                )
                .foregroundColor(Color(hex: "D5D7DA"))
                .rotationEffect(.degrees(startRotation))

            // Arc de progression (noir) — rempli de gauche à droite
            Circle()
                .trim(from: 0, to: min(progress, 1.0) * arcFraction)
                .stroke(
                    style: StrokeStyle(lineWidth: 5, lineCap: .butt, dash: [5.5, 2.5])
                )
                .foregroundColor(Color(hex: "181D27"))
                .rotationEffect(.degrees(startRotation))
        }
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Ligne participant (ParticipantRow)
// ─────────────────────────────────────────────────────────────

struct ParticipantRow: View {
    let name: String
    let page: Int
    let avatarColor: Color

    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(avatarColor)
                    .frame(width: 35, height: 35)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.25), radius: 3, x: 0, y: 2)

                Text(String(name.prefix(1)).uppercased())
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(width: 35, height: 35)

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "535862"))
                    .lineLimit(1)

                Text("\(page)")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Color(hex: "181D27"))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Déclaration du widget
//
// contentMarginsDisabled() supprime les marges automatiques
// d'iOS 17 pour que le contenu puisse déborder (PopEyes).
// ─────────────────────────────────────────────────────────────

struct bbbWidget: Widget {
    let kind: String = "bbbWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            bbbWidgetEntryView(entry: entry)
                .containerBackground(.white, for: .widget)
        }
        .configurationDisplayName("Bestie Book Battle")
        .description("Le classement de ton challenge lecture")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Extension Color hex
// ─────────────────────────────────────────────────────────────

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Prévisualisation
// ─────────────────────────────────────────────────────────────

#Preview(as: .systemSmall) {
    bbbWidget()
} timeline: {
    BookEntry.placeholder
}

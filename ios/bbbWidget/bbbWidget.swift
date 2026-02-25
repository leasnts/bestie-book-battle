//
//  bbbWidget.swift
//  bbbWidget
//
//  Widget Bestie Book Battle
//  Affiche la progression de lecture : mon avancement vs celui de mon·ma ami·e
//

import WidgetKit
import SwiftUI

// ─────────────────────────────────────────────────────────────
// MARK: - Modèle de données
//
// Cette structure doit correspondre exactement à ce qu'on envoie
// depuis React Native dans utils/widget.ts
// ─────────────────────────────────────────────────────────────

struct WidgetData: Codable {
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
// MARK: - Entry (l'objet que le widget affiche à un instant T)
// ─────────────────────────────────────────────────────────────

struct BookEntry: TimelineEntry {
    let date: Date
    let bookTitle: String
    let bookAuthor: String
    let myCurrentPage: Int
    let myTotalPages: Int
    let myStreak: Int
    let friendName: String?
    let friendCurrentPage: Int?

    // Calcul du pourcentage de progression (0.0 → 1.0)
    var myProgress: Double {
        guard myTotalPages > 0 else { return 0 }
        return Double(myCurrentPage) / Double(myTotalPages)
    }

    var friendProgress: Double? {
        guard let pages = friendCurrentPage, myTotalPages > 0 else { return nil }
        return Double(pages) / Double(myTotalPages)
    }

    // Vrai si je suis devant mon·ma ami·e (ou si je suis seul·e)
    var iAmWinning: Bool {
        guard let friendPages = friendCurrentPage else { return true }
        return myCurrentPage >= friendPages
    }

    // Données de prévisualisation dans l'éditeur Xcode
    static var placeholder: BookEntry {
        BookEntry(
            date: Date(),
            bookTitle: "Harry Potter",
            bookAuthor: "J.K. Rowling",
            myCurrentPage: 142,
            myTotalPages: 652,
            myStreak: 5,
            friendName: "Zoé",
            friendCurrentPage: 98
        )
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Provider (fournit les données au widget)
//
// C'est ici qu'on lit l'App Group pour récupérer ce que React
// Native a écrit avec `react-native-shared-group-preferences`.
// ─────────────────────────────────────────────────────────────

struct Provider: TimelineProvider {

    // Affiché instantanément pendant le chargement
    func placeholder(in context: Context) -> BookEntry {
        .placeholder
    }

    // Affiché dans la galerie de widgets iOS
    func getSnapshot(in context: Context, completion: @escaping (BookEntry) -> Void) {
        completion(loadEntry())
    }

    // Planifie les mises à jour du widget (toutes les 15 minutes)
    func getTimeline(in context: Context, completion: @escaping (Timeline<BookEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    // Lit les données depuis l'App Group partagé avec l'app principale
    private func loadEntry() -> BookEntry {
        let userDefaults = UserDefaults(suiteName: "group.com.leasantos.bestiebookbattle")

        if let jsonString = userDefaults?.string(forKey: "widgetData"),
           let data = jsonString.data(using: .utf8),
           let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return BookEntry(
                date: Date(),
                bookTitle: widgetData.bookTitle,
                bookAuthor: widgetData.bookAuthor,
                myCurrentPage: widgetData.myCurrentPage,
                myTotalPages: widgetData.myTotalPages,
                myStreak: widgetData.myStreak,
                friendName: widgetData.friendName,
                friendCurrentPage: widgetData.friendCurrentPage
            )
        }

        // Si aucune donnée n'a encore été écrite par l'app, on affiche un état vide
        return BookEntry(
            date: Date(),
            bookTitle: "Ouvre l'app !",
            bookAuthor: "Bestie Book Battle",
            myCurrentPage: 0,
            myTotalPages: 1,
            myStreak: 0,
            friendName: nil,
            friendCurrentPage: nil
        )
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Vue principale (choisit le layout selon la taille)
// ─────────────────────────────────────────────────────────────

struct bbbWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: BookEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Petit widget (systemSmall)
//
// Layout :
//   📚 Titre du livre
//   ──────────────
//   Barre de progression orange
//   Page X / Y
//   🔥5    78%
// ─────────────────────────────────────────────────────────────

struct SmallWidgetView: View {
    let entry: BookEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // Emoji livre + titre
            HStack(spacing: 5) {
                Text("📚")
                    .font(.system(size: 14))
                Text(entry.bookTitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 8)

            // Barre de progression
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 7)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: "F97316"))
                        .frame(width: geo.size.width * entry.myProgress, height: 7)
                }
            }
            .frame(height: 7)

            Spacer(minLength: 6)

            // Page actuelle
            Text("Page \(entry.myCurrentPage) / \(entry.myTotalPages)")
                .font(.system(size: 10))
                .foregroundColor(Color(hex: "717680"))

            Spacer(minLength: 8)

            // Streak + pourcentage
            HStack {
                if entry.myStreak > 0 {
                    HStack(spacing: 3) {
                        Text("🔥")
                            .font(.system(size: 11))
                        Text("\(entry.myStreak)")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(hex: "F97316"))
                    }
                }
                Spacer()
                Text("\(Int(entry.myProgress * 100))%")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "181d27"))
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Grand widget (systemMedium)
//
// Layout :
//   📚 Harry Potter · J.K. Rowling       652 pages
//   ──────────────────────────────────────────────
//   Moi 👑                  │  Zoé
//   142 pages               │  98 pages
//   ████████░░░░ 21%        │  ██████░░░░░ 15%
//   🔥5                     │
// ─────────────────────────────────────────────────────────────

struct MediumWidgetView: View {
    let entry: BookEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {

            // En-tête : titre + total pages
            HStack(alignment: .top) {
                HStack(spacing: 5) {
                    Text("📚")
                        .font(.system(size: 13))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(entry.bookTitle)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Text(entry.bookAuthor)
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "717680"))
                            .lineLimit(1)
                    }
                }
                Spacer()
                Text("\(entry.myTotalPages) pages")
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "535862"))
            }

            // Ligne de séparation
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)

            // Comparaison côte à côte
            HStack(spacing: 0) {

                // ── Moi ──
                ParticipantColumnView(
                    name: "Moi",
                    currentPage: entry.myCurrentPage,
                    totalPages: entry.myTotalPages,
                    progress: entry.myProgress,
                    streak: entry.myStreak,
                    isWinning: entry.iAmWinning
                )

                // Séparateur vertical
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 1)
                    .padding(.horizontal, 12)

                // ── Ami·e ──
                if let name = entry.friendName,
                   let pages = entry.friendCurrentPage,
                   let progress = entry.friendProgress {
                    ParticipantColumnView(
                        name: name,
                        currentPage: pages,
                        totalPages: entry.myTotalPages,
                        progress: progress,
                        streak: nil,
                        isWinning: !entry.iAmWinning
                    )
                } else {
                    // Pas encore d'ami·e dans le challenge
                    VStack(spacing: 4) {
                        Text("✉️")
                            .font(.system(size: 20))
                        Text("Invite\nun·e ami·e")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "535862"))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "181d27"))
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Colonne d'un participant (réutilisée dans le medium)
// ─────────────────────────────────────────────────────────────

struct ParticipantColumnView: View {
    let name: String
    let currentPage: Int
    let totalPages: Int
    let progress: Double
    let streak: Int?
    let isWinning: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {

            // Nom + couronne si en tête
            HStack(spacing: 4) {
                Text(name)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                if isWinning {
                    Text("👑")
                        .font(.system(size: 10))
                }
            }

            // Pages lues
            Text("\(currentPage) pages")
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "717680"))

            // Barre de progression
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 5)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(isWinning ? Color(hex: "F97316") : Color(hex: "535862"))
                        .frame(width: geo.size.width * min(progress, 1.0), height: 5)
                }
            }
            .frame(height: 5)

            // Pourcentage + streak (si disponible)
            HStack(spacing: 4) {
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(isWinning ? Color(hex: "F97316") : Color(hex: "717680"))

                if let streak = streak, streak > 0 {
                    Spacer()
                    Text("🔥\(streak)")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "F97316"))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Déclaration du widget
// ─────────────────────────────────────────────────────────────

struct bbbWidget: Widget {
    let kind: String = "bbbWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            bbbWidgetEntryView(entry: entry)
                .containerBackground(Color(hex: "181d27"), for: .widget)
        }
        .configurationDisplayName("Bestie Book Battle")
        .description("Ta progression de lecture et celle de ton·ta ami·e")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Extension utilitaire : couleur depuis un code hex
//
// Permet d'utiliser les couleurs de l'app (ex: Color(hex: "F97316"))
// sans avoir à convertir en RGB manuellement à chaque fois.
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
// MARK: - Prévisualisations Xcode (Canvas)
// ─────────────────────────────────────────────────────────────

#Preview(as: .systemSmall) {
    bbbWidget()
} timeline: {
    BookEntry.placeholder
}

#Preview(as: .systemMedium) {
    bbbWidget()
} timeline: {
    BookEntry.placeholder
}

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    return (
        <button
            onClick={cycleTheme}
            className="relative p-2 rounded-xl bg-background/50 border border-border hover:bg-accent/50 transition-all active:scale-95 overflow-hidden w-10 h-10 flex items-center justify-center shadow-sm"
            aria-label="Toggle theme"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

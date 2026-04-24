import { describe, expect, it } from 'vitest'
import { formatSkillNameDisplay, normalizeSkillName } from '@/lib/skill-name-normalize'

describe('normalizeSkillName', () => {
    it('slugifies input', () => {
        expect(normalizeSkillName('Hello World')).toBe('hello-world')
    })
})

describe('formatSkillNameDisplay', () => {
    it('replaces hyphens and underscores and title-cases', () => {
        expect(formatSkillNameDisplay('current-weather-lookup')).toBe(
            'Current Weather Lookup',
        )
        expect(formatSkillNameDisplay('foo_bar-baz')).toBe('Foo Bar Baz')
    })

    it('handles slashes', () => {
        expect(formatSkillNameDisplay('a/b-c')).toBe('A B C')
    })

    it('uses fallback for empty or invalid', () => {
        expect(formatSkillNameDisplay('', 'x')).toBe('x')
        expect(formatSkillNameDisplay(null, 'y')).toBe('y')
        expect(formatSkillNameDisplay({}, 'z')).toBe('z')
    })
})

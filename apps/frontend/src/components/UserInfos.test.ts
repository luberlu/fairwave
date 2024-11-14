import { render, fireEvent } from '@testing-library/svelte';
import { vi, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import UserInfos from './UserInfos.svelte';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('../lib/user/UserStore', () => ({
	username: {
		subscribe: (fn: (value: string) => void) => {
			fn('Caribou');
			return () => {};
		}
	}
}));

test('affiche le nom de l’utilisateur et redirige vers la page de profil au clic', async () => {
	// Rendu du composant
	const { container, getByText } = render(UserInfos);

	// Vérifie que le nom de l’utilisateur est affiché
	const paragraph = container.querySelector('p');
	expect(paragraph).toHaveTextContent('Hello, Caribou!');

	// Clic sur le bouton pour aller au profil
	const profileButton = getByText('Caribou');
	await fireEvent.click(profileButton);

	// Vérifie que `goto` est appelé avec la bonne URL
	expect(goto).toHaveBeenCalledWith('/user/profile');
});

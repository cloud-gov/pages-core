import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LocationBar from './LocationBar';

describe('LocationBar Component', () => {
  const mockOnNavigate = jest.fn();
  const storageRoot = 'https://example.gov/~assets';
  const siteId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders root directory correctly, in text (not link) if current directory', () => {
    render(
      /* MemoryRouter allows us to render components that use react Link  */
      <MemoryRouter>
        <LocationBar
          path=""
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(`${storageRoot}/`)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: `${storageRoot}/` }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('../')).not.toBeInTheDocument();
  });

  it('renders single-level folder correctly, with parent as link', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path="foo"
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: `${storageRoot}/` })).toBeInTheDocument();
    expect(screen.getByText('foo/')).toBeInTheDocument();
  });

  test('renders nested folders with ../ link', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path="foo/bar"
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '../' })).toBeInTheDocument();
    expect(screen.getByText('bar/')).toBeInTheDocument();
  });

  it('clicking a breadcrumb calls onNavigate', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path="foo/bar"
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: '../' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('foo/');

    fireEvent.click(screen.getByRole('link', { name: 'foo/' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('foo/');
  });

  it('renders deep nested path correctly', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path="foo/bar/baz"
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '../' })).toBeInTheDocument();
    expect(screen.getByText('baz/')).toBeInTheDocument();
  });

  it('does not render ../ at root level', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path=""
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: '../' })).not.toBeInTheDocument();
  });

  test('clicking domain/~assets resets to root if it is a link', () => {
    render(
      <MemoryRouter>
        <LocationBar
          path="foo"
          siteId={siteId}
          storageRoot={storageRoot}
          onNavigate={mockOnNavigate}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: `${storageRoot}/` }));
    expect(mockOnNavigate).toHaveBeenCalledWith('/');
  });
});

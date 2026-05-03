import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ChipInput from './ChipInput';

describe('ChipInput', () => {
  it('adds a normalized chip on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput
        label="Preferred categories"
        values={[]}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('Type and press Enter');
    await user.type(input, '  Backend   Engineer  ');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(['Backend Engineer']);
  });

  it('does not add duplicate chips ignoring case', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput
        label="Preferred categories"
        values={['Backend']}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('Type and press Enter');
    await user.type(input, 'backend');
    await user.keyboard('{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes the last chip on Backspace when the draft is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput
        label="Preferred categories"
        values={['Backend', 'Fullstack']}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('Type and press Enter');
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['Backend']);
  });
});
